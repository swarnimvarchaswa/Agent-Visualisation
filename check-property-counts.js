const fs = require('fs');
const path = require('path');

// Read the data files
const agentsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'agents.json'), 'utf-8')
);

const enquiriesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'enquiries.json'), 'utf-8')
);

const propertiesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'properties.json'), 'utf-8')
);

console.log('='.repeat(70));
console.log('DETAILED PROPERTY ANALYSIS');
console.log('='.repeat(70));
console.log();

// Count properties by listing type
let totalResaleProperties = 0;
let totalRentalProperties = 0;
let resaleWithPrice = 0;
let rentalWithPrice = 0;
let resaleWithoutPrice = 0;
let rentalWithoutPrice = 0;

for (const [propId, property] of Object.entries(propertiesData)) {
  if (property.listingType === 'resale') {
    totalResaleProperties++;
    const price = (property.pricing && property.pricing.totalAskPrice) || property.totalAskPrice || 0;
    if (price && price > 0) {
      resaleWithPrice++;
    } else {
      resaleWithoutPrice++;
    }
  } else if (property.listingType === 'rental') {
    totalRentalProperties++;
    const rent = (property.rentalInfo && (property.rentalInfo.rent || property.rentalInfo.rentalIncome)) || 0;
    if (rent && rent > 0) {
      rentalWithPrice++;
    } else {
      rentalWithoutPrice++;
    }
  }
}

console.log('PROPERTIES IN DATABASE:');
console.log(`Total Resale Properties: ${totalResaleProperties}`);
console.log(`  - With Price: ${resaleWithPrice}`);
console.log(`  - Without Price: ${resaleWithoutPrice}`);
console.log();
console.log(`Total Rental Properties: ${totalRentalProperties}`);
console.log(`  - With Rent: ${rentalWithPrice}`);
console.log(`  - Without Rent: ${rentalWithoutPrice}`);
console.log();

// Now check what agents are using
let agentResaleCount = 0;
let agentRentalCount = 0;
let agentResaleFromEnquiries = 0;
let agentRentalFromEnquiries = 0;
let agentResaleFromInventories = 0;
let agentRentalFromInventories = 0;

const uniqueResaleProps = new Set();
const uniqueRentalProps = new Set();

for (const [agentId, agentInfo] of Object.entries(agentsData)) {
  const enquiryDid = agentInfo.enquiryDid || [];
  const myInventories = agentInfo.myInventories || [];
  
  // Process enquiries
  for (const enquiryId of enquiryDid) {
    const enquiry = enquiriesData[enquiryId];
    if (enquiry && enquiry.propertyId) {
      const property = propertiesData[enquiry.propertyId];
      if (property) {
        if (property.listingType === 'resale') {
          const price = (property.pricing && property.pricing.totalAskPrice) || property.totalAskPrice || 0;
          if (price && price > 0) {
            agentResaleCount++;
            agentResaleFromEnquiries++;
            uniqueResaleProps.add(enquiry.propertyId);
          }
        } else if (property.listingType === 'rental') {
          const rent = (property.rentalInfo && (property.rentalInfo.rent || property.rentalInfo.rentalIncome)) || 0;
          if (rent && rent > 0) {
            agentRentalCount++;
            agentRentalFromEnquiries++;
            uniqueRentalProps.add(enquiry.propertyId);
          }
        }
      }
    }
  }
  
  // Process inventories
  for (const propertyId of myInventories) {
    const property = propertiesData[propertyId];
    if (property) {
      if (property.listingType === 'resale') {
        const price = (property.pricing && property.pricing.totalAskPrice) || property.totalAskPrice || 0;
        if (price && price > 0) {
          agentResaleCount++;
          agentResaleFromInventories++;
          uniqueResaleProps.add(propertyId);
        }
      } else if (property.listingType === 'rental') {
        const rent = (property.rentalInfo && (property.rentalInfo.rent || property.rentalInfo.rentalIncome)) || 0;
        if (rent && rent > 0) {
          agentRentalCount++;
          agentRentalFromInventories++;
          uniqueRentalProps.add(propertyId);
        }
      }
    }
  }
}

console.log('PROPERTIES USED BY AGENTS (with valid prices):');
console.log(`Total Resale: ${agentResaleCount} (from ${uniqueResaleProps.size} unique properties)`);
console.log(`  - From Enquiries: ${agentResaleFromEnquiries}`);
console.log(`  - From Inventories: ${agentResaleFromInventories}`);
console.log();
console.log(`Total Rental: ${agentRentalCount} (from ${uniqueRentalProps.size} unique properties)`);
console.log(`  - From Enquiries: ${agentRentalFromEnquiries}`);
console.log(`  - From Inventories: ${agentRentalFromInventories}`);
console.log();

console.log('='.repeat(70));
console.log('SUMMARY:');
console.log('='.repeat(70));
console.log(`Database has ${totalResaleProperties} resale properties (${resaleWithPrice} with price)`);
console.log(`Database has ${totalRentalProperties} rental properties (${rentalWithPrice} with rent)`);
console.log();
console.log(`Agents use ${agentResaleCount} resale instances (${uniqueResaleProps.size} unique properties)`);
console.log(`Agents use ${agentRentalCount} rental instances (${uniqueRentalProps.size} unique properties)`);
console.log();
console.log(`Missing from agent data:`);
console.log(`  Resale: ${resaleWithPrice - uniqueResaleProps.size} properties not used by any agent`);
console.log(`  Rental: ${rentalWithPrice - uniqueRentalProps.size} properties not used by any agent`);
