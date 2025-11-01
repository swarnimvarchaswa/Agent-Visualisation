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
console.log('RENTAL PROPERTIES DEEP DIVE');
console.log('='.repeat(70));
console.log();

// Step 1: Count all rental properties and check their rent values
let totalRentalProps = 0;
let rentalWithRent = 0;
let rentalWithRentalIncome = 0;
let rentalWithoutRent = 0;
let rentalWithZeroRent = 0;
let rentalWithNullRent = 0;

const rentalExamples = {
  withRent: [],
  withRentalIncome: [],
  withoutRent: [],
  withZeroRent: []
};

for (const [propId, property] of Object.entries(propertiesData)) {
  if (property.listingType === 'rental') {
    totalRentalProps++;
    
    const rent = property.rentalInfo && property.rentalInfo.rent;
    const rentalIncome = property.rentalInfo && property.rentalInfo.rentalIncome;
    
    if (rent && rent > 0) {
      rentalWithRent++;
      if (rentalExamples.withRent.length < 3) {
        rentalExamples.withRent.push({ id: propId, rent, rentalIncome });
      }
    } else if (rentalIncome && rentalIncome > 0) {
      rentalWithRentalIncome++;
      if (rentalExamples.withRentalIncome.length < 3) {
        rentalExamples.withRentalIncome.push({ id: propId, rent, rentalIncome });
      }
    } else if (rent === 0) {
      rentalWithZeroRent++;
      if (rentalExamples.withZeroRent.length < 3) {
        rentalExamples.withZeroRent.push({ id: propId, rent, rentalIncome });
      }
    } else if (!property.rentalInfo || rent === null) {
      rentalWithNullRent++;
      if (rentalExamples.withoutRent.length < 3) {
        rentalExamples.withoutRent.push({ id: propId, rentalInfo: property.rentalInfo });
      }
    } else {
      rentalWithoutRent++;
    }
  }
}

console.log('RENTAL PROPERTIES BREAKDOWN:');
console.log(`Total Rental Properties: ${totalRentalProps}`);
console.log(`  - With rent > 0: ${rentalWithRent}`);
console.log(`  - With rentalIncome > 0: ${rentalWithRentalIncome}`);
console.log(`  - With rent = 0: ${rentalWithZeroRent}`);
console.log(`  - With null/undefined rent: ${rentalWithNullRent}`);
console.log(`  - Other: ${rentalWithoutRent}`);
console.log();

console.log('EXAMPLES:');
console.log('With rent > 0:', JSON.stringify(rentalExamples.withRent, null, 2));
console.log('With rentalIncome > 0:', JSON.stringify(rentalExamples.withRentalIncome, null, 2));
console.log('With rent = 0:', JSON.stringify(rentalExamples.withZeroRent, null, 2));
console.log('Without rent:', JSON.stringify(rentalExamples.withoutRent, null, 2));
console.log();

// Step 2: Check which rental properties are linked to agents
const rentalPropsUsedByAgents = new Set();
const rentalPropsInEnquiries = new Set();
const rentalPropsInInventories = new Set();

for (const [agentId, agentInfo] of Object.entries(agentsData)) {
  const enquiryDid = agentInfo.enquiryDid || [];
  const myInventories = agentInfo.myInventories || [];
  
  // Check enquiries
  for (const enquiryId of enquiryDid) {
    const enquiry = enquiriesData[enquiryId];
    if (enquiry && enquiry.propertyId) {
      const property = propertiesData[enquiry.propertyId];
      if (property && property.listingType === 'rental') {
        rentalPropsInEnquiries.add(enquiry.propertyId);
        
        const rent = (property.rentalInfo && (property.rentalInfo.rent || property.rentalInfo.rentalIncome)) || 0;
        if (rent && rent > 0) {
          rentalPropsUsedByAgents.add(enquiry.propertyId);
        }
      }
    }
  }
  
  // Check inventories
  for (const propertyId of myInventories) {
    const property = propertiesData[propertyId];
    if (property && property.listingType === 'rental') {
      rentalPropsInInventories.add(propertyId);
      
      const rent = (property.rentalInfo && (property.rentalInfo.rent || property.rentalInfo.rentalIncome)) || 0;
      if (rent && rent > 0) {
        rentalPropsUsedByAgents.add(propertyId);
      }
    }
  }
}

console.log('RENTAL PROPERTIES LINKED TO AGENTS:');
console.log(`Total rental props in enquiries: ${rentalPropsInEnquiries.size}`);
console.log(`Total rental props in inventories: ${rentalPropsInInventories.size}`);
console.log(`Total unique rental props (enquiries + inventories): ${new Set([...rentalPropsInEnquiries, ...rentalPropsInInventories]).size}`);
console.log(`Rental props with valid rent used by agents: ${rentalPropsUsedByAgents.size}`);
console.log();

console.log('='.repeat(70));
console.log('CONCLUSION:');
console.log('='.repeat(70));
console.log(`Out of ${totalRentalProps} rental properties in DB:`);
console.log(`  - ${rentalWithRent} have rent > 0`);
console.log(`  - ${rentalWithRentalIncome} have rentalIncome > 0 (but rent is 0 or null)`);
console.log(`  - ${new Set([...rentalPropsInEnquiries, ...rentalPropsInInventories]).size} are linked to agent enquiries/inventories`);
console.log(`  - Only ${rentalPropsUsedByAgents.size} have valid rent AND are used by agents`);
console.log();
console.log(`Missing rental properties: ${totalRentalProps - new Set([...rentalPropsInEnquiries, ...rentalPropsInInventories]).size} not linked to any agent`);
console.log(`Rental props without price: ${new Set([...rentalPropsInEnquiries, ...rentalPropsInInventories]).size - rentalPropsUsedByAgents.size} linked to agents but have no/zero rent`);
