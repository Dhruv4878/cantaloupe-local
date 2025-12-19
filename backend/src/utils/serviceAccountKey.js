// Prefer env vars; fall back to local JSON when not provided
const path = require('path');

function buildFromEnv() {
  if (!process.env.FIREBASE_PROJECT_ID) return null;
  return {
    type: process.env.FIREBASE_TYPE,
    project_id: String(process.env.FIREBASE_PROJECT_ID),
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,  
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
  };
}

let serviceAccount = buildFromEnv();

if (!serviceAccount) {
  // Resolve relative to this file: ../config/serviceAccountKey.json
  const jsonPath = path.join(__dirname, '..', 'config', 'serviceAccountKey.json');
  // eslint-disable-next-line import/no-dynamic-require, global-require
  serviceAccount = require(jsonPath);
}

module.exports = serviceAccount;