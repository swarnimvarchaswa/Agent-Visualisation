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

// Create qcId to property lookup
const qcIdToProperty = {};
for (const [propId, property] of Object.entries(propertiesData)) {
  if (property.qcId) {
    qcIdToProperty[property.qcId] = property;
  }
}

// Helper function to normalize zone names
const normalizeZone = (zone) => {
  if (!zone) return null;
  const zoneLower = zone.toLowerCase().trim();
  
  if (zoneLower.includes('north') || zoneLower === 'north') return 'North Bangalore';
  if (zoneLower.includes('south') || zoneLower === 'south') return 'South Bangalore';
  if (zoneLower.includes('east') || zoneLower === 'east') return 'East Bangalore';
  if (zoneLower.includes('west') || zoneLower === 'west') return 'West Bangalore';
  if (zoneLower.includes('central') || zoneLower === 'central') return 'Central Bangalore';
  
  return null;
};

// Helper to get primary zone from areaOfOperation
const getPrimaryZoneFromAreaOfOperation = (areaOfOperation) => {
  if (!areaOfOperation || !Array.isArray(areaOfOperation) || areaOfOperation.length === 0) {
    return 'PAN Bangalore';
  }
  
  // Check if PAN Bangalore is in the list
  const hasPan = areaOfOperation.some(area => 
    area && area.toLowerCase().includes('pan')
  );
  
  if (hasPan || areaOfOperation.length > 1) {
    return 'PAN Bangalore';
  }
  
  // Single area - try to normalize it
  const normalized = normalizeZone(areaOfOperation[0]);
  return normalized || 'PAN Bangalore';
};

const categorizedAgents = {
  'North Bangalore': [],
  'South Bangalore': [],
  'East Bangalore': [],
  'West Bangalore': [],
  'Central Bangalore': [],
  'PAN Bangalore': []
};

let totalWithFsmToken = 0;
let usedEnquiryPropertyData = 0;
let usedAreaOfOperation = 0;

// Process each agent
for (const [agentId, agentInfo] of Object.entries(agentsData)) {
  // Check if agent has FSM token
  const hasFsmToken = agentInfo.fsmToken && 
                     Array.isArray(agentInfo.fsmToken) && 
                     agentInfo.fsmToken.length > 0;
  
  if (!hasFsmToken) continue;
  
  totalWithFsmToken++;
  
  const enquiryDid = agentInfo.enquiryDid || [];
  const myInventories = agentInfo.myInventories || [];
  
  const zoneCounts = {};
  
  // Process enquiries
  for (const enquiryId of enquiryDid) {
    const enquiry = enquiriesData[enquiryId];
    if (enquiry && enquiry.propertyId) {
      const property = propertiesData[enquiry.propertyId];
      if (property && property.zone) {
        const zone = normalizeZone(property.zone);
        if (zone) {
          zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
        }
      }
    }
  }
  
  // Process inventories
  for (const propertyId of myInventories) {
    let property = propertiesData[propertyId];
    if (!property) {
      property = qcIdToProperty[propertyId];
    }
    if (property && property.zone) {
      const zone = normalizeZone(property.zone);
      if (zone) {
        zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
      }
    }
  }
  
  let primaryZone = null;
  
  // If we have zone data from enquiries/properties
  if (Object.keys(zoneCounts).length > 0) {
    // Find the zone with maximum count
    let maxCount = 0;
    const zonesWithMaxCount = [];
    
    for (const [zone, count] of Object.entries(zoneCounts)) {
      if (count > maxCount) {
        maxCount = count;
        zonesWithMaxCount.length = 0;
        zonesWithMaxCount.push(zone);
      } else if (count === maxCount) {
        zonesWithMaxCount.push(zone);
      }
    }
    
    // If tied, just pick the first one
    primaryZone = zonesWithMaxCount[0];
    usedEnquiryPropertyData++;
  } else {
    // No zone data from enquiries/properties, use areaOfOperation
    primaryZone = getPrimaryZoneFromAreaOfOperation(agentInfo.areaOfOperation);
    usedAreaOfOperation++;
  }
  
  categorizedAgents[primaryZone].push(agentId);
}

// Write results to files
console.log('='.repeat(70));
console.log('AGENT CATEGORIZATION BY PRIMARY ZONE (FSM Token Holders Only)');
console.log('='.repeat(70));
console.log();
console.log(`Total agents with FSM token: ${totalWithFsmToken}`);
console.log(`Categorized using enquiry/property data: ${usedEnquiryPropertyData}`);
console.log(`Categorized using area of operation: ${usedAreaOfOperation}`);
console.log();

const outputDir = path.join(__dirname, 'zone-categorization');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Create individual files for each zone
for (const [zone, agents] of Object.entries(categorizedAgents)) {
  const fileName = zone.replace(/ /g, '_').toLowerCase() + '.txt';
  const filePath = path.join(outputDir, fileName);
  
  // Write one CP ID per line
  fs.writeFileSync(filePath, agents.join('\n'));
  
  console.log(`${zone}: ${agents.length} agents`);
  console.log(`  File: ${fileName}`);
}

console.log();
console.log('='.repeat(70));
console.log('Files created in: zone-categorization/');
console.log('='.repeat(70));
console.log();

// Create a summary file with all data
const summaryPath = path.join(outputDir, 'summary.json');
const summary = {
  totalAgentsWithFsmToken: totalWithFsmToken,
  categorizedUsingEnquiryPropertyData: usedEnquiryPropertyData,
  categorizedUsingAreaOfOperation: usedAreaOfOperation,
  breakdown: {}
};

for (const [zone, agents] of Object.entries(categorizedAgents)) {
  summary.breakdown[zone] = {
    count: agents.length,
    percentage: ((agents.length / totalWithFsmToken) * 100).toFixed(2) + '%'
  };
}

fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

console.log('Summary saved to: summary.json');
console.log();

// Display first 5 agents from each zone as preview
console.log('='.repeat(70));
console.log('PREVIEW (First 5 agents from each zone):');
console.log('='.repeat(70));
console.log();

for (const [zone, agents] of Object.entries(categorizedAgents)) {
  if (agents.length > 0) {
    console.log(`${zone}:`);
    agents.slice(0, 5).forEach(cpId => console.log(`  ${cpId}`));
    if (agents.length > 5) {
      console.log(`  ... and ${agents.length - 5} more`);
    }
    console.log();
  }
}
