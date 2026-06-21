const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

if (admin.apps.length === 0) {
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
            : null;

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("[Firebase Admin] Initialized successfully using service account key.");
        } else {
            // Check if application default credentials can be initialized, otherwise catch error
            admin.initializeApp({
                credential: admin.credential.applicationDefault()
            });
            console.log("[Firebase Admin] Initialized using Application Default Credentials.");
        }
    } catch (err) {
        console.warn("[Firebase Admin] Initialization failed or credentials missing. Notifications will run in dry-run/mock mode.", err.message);
    }
}

module.exports = admin;
