// Firebase Collection to JSON Export Script
require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin with environment variables
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
  universe_domain: "googleapis.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportCollectionToJSON(collectionName, outputFile) {
  try {
    const snapshot = await db.collection(collectionName).get();
    
    const data = {};
    
    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });
    
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
    
    console.log(`✅ Successfully exported ${snapshot.size} documents to ${outputFile}`);
    return data;
  } catch (error) {
    console.error('❌ Error exporting collection:', error);
    throw error;
  }
}

// Usage

// const collectionName = 'acnAgents';
// const outputFile = './data/agents.json';

const collectionName = 'acnTestProperties';
const outputFile = './data/properties.json';

exportCollectionToJSON(collectionName, outputFile)
  .then(() => process.exit(0))
  .catch(err => process.exit(1));