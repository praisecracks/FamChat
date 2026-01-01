/**
 * Script to populate missing `expiresAt` on existing `statuses` documents.
 * Usage:
 * 1. Ensure GOOGLE_APPLICATION_CREDENTIALS is set to a service account key with Firestore write permissions
 * 2. Run: node scripts/populate_expires.js
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function run() {
  console.log('Scanning statuses for missing expiresAt...');

  const batchSize = 500;
  const cutoff = new Date(0); // get all; we'll only update those missing
  const snapshot = await db.collection('statuses').where('expiresAt', '==', null).limit(batchSize).get();

  if (snapshot.empty) {
    console.log('No statuses found without expiresAt.');
    return;
  }

  const batch = db.batch();
  let count = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    // prefer to set expiresAt = timestamp + 24h when possible
    let expiresAt = null;
    if (data.timestamp && data.timestamp.toDate) {
      expiresAt = new Date(data.timestamp.toDate().getTime() + 24 * 60 * 60 * 1000);
    } else if (typeof data.timestamp === 'number') {
      expiresAt = new Date(data.timestamp + 24 * 60 * 60 * 1000);
    } else {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    batch.update(doc.ref, { expiresAt });
    count++;
  });

  await batch.commit();
  console.log(`Updated ${count} status docs with expiresAt.`);
  console.log('Done. Run repeatedly until zero docs are found (or extend to paginate).');
}

run().catch((err) => {
  console.error('Failed to run migration:', err);
  process.exit(1);
});
