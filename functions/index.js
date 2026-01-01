const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cloudinary = require('cloudinary').v2;
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Prefer using Firebase Functions config to store Cloudinary credentials
const cfg = functions.config().cloudinary || {};
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || cfg.cloud_name,
  api_key: process.env.CLOUDINARY_API_KEY || cfg.api_key,
  api_secret: process.env.CLOUDINARY_API_SECRET || cfg.api_secret,
});

// Triggered when a status document is deleted (including TTL deletions)
exports.deleteCloudinaryOnStatusDelete = functions.firestore
  .document('statuses/{statusId}')
  .onDelete(async (snap, context) => {
    const data = snap.data();
    if (!data) return null;

    const publicId = data.publicId || data.public_id;
    if (!publicId) {
      console.log('No publicId on deleted status; nothing to remove from Cloudinary');
      return null;
    }

    const resourceType = data.type === 'video' ? 'video' : 'image';

    try {
      const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log('Cloudinary delete result for', publicId, res);
    } catch (err) {
      console.error('Failed to delete Cloudinary resource', publicId, err);
    }

    return null;
  });

// Scheduled cleanup (fallback): runs every 5 minutes to remove expired status docs
// Useful when TTL is not enabled or to ensure cleanup is timely.
exports.scheduledExpiredStatusCleanup = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const db = admin.firestore();
    try {
      const q = await db.collection('statuses').where('expiresAt', '<=', now).limit(500).get();
      if (q.empty) {
        console.log('No expired statuses to delete.');
        return null;
      }

      const batch = db.batch();
      const deletions = [];

      q.docs.forEach((docSnap) => {
        const data = docSnap.data() || {};
        const publicId = data.publicId || data.public_id;
        if (publicId) {
          const resourceType = data.type === 'video' ? 'video' : 'image';
          deletions.push(
            cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).then((res) => {
              console.log('Cloudinary delete for', publicId, res);
            }).catch((err) => {
              console.error('Cloudinary delete failed for', publicId, err);
            })
          );
        }
        batch.delete(docSnap.ref);
      });

      await Promise.all(deletions);
      await batch.commit();

      console.log('Scheduled cleanup: deleted', q.size, 'expired statuses');
    } catch (err) {
      console.error('Scheduled cleanup failed:', err);
    }

    return null;
  });

// HTTP endpoint with CORS as a fallback for clients that encounter CORS problems with callables
exports.deleteStatusHttp = functions.https.onRequest((req, res) => {
  // Handle preflight explicitly so the browser gets proper CORS headers
  if (req.method === 'OPTIONS') {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.status(204).send('');
  }

  // Allow CORS and run handler
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      res.set({ 'Access-Control-Allow-Origin': '*' });
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Expect Authorization: Bearer <idToken>
    const authHeader = req.get('Authorization') || '';
    const match = authHeader.match(/^Bearer (.*)$/);
    if (!match) {
      res.set({ 'Access-Control-Allow-Origin': '*' });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = match[1];

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;
      const { statusId } = req.body || {};
      if (!statusId) {
        res.set({ 'Access-Control-Allow-Origin': '*' });
        return res.status(400).json({ error: 'Missing statusId' });
      }

      const db = admin.firestore();
      const ref = db.collection('statuses').doc(statusId);
      const snap = await ref.get();
      if (!snap.exists) {
        res.set({ 'Access-Control-Allow-Origin': '*' });
        return res.status(404).json({ error: 'Status not found' });
      }

      const status = snap.data();
      if (status.userId !== uid) {
        res.set({ 'Access-Control-Allow-Origin': '*' });
        return res.status(403).json({ error: 'Forbidden' });
      }

      const publicId = status.publicId || status.public_id;
      if (publicId) {
        const resourceType = status.type === 'video' ? 'video' : 'image';
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        } catch (err) {
          console.error('Cloudinary delete failed', publicId, err);
        }
      }

      try {
        const archivesQ = await db.collection('users').doc(uid).collection('archives').where('statusId', '==', statusId).get();
        const batch = db.batch();
        archivesQ.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      } catch (err) {
        console.error('Failed to delete archive copies', err);
      }

      await ref.delete();

      res.set({ 'Access-Control-Allow-Origin': '*' });
      return res.json({ success: true });
    } catch (err) {
      console.error('deleteStatusHttp failed:', err);
      res.set({ 'Access-Control-Allow-Origin': '*' });
      return res.status(500).json({ error: 'Internal' });
    }
  });
});

// Callable admin delete: allows the owner to request deletion via callable function
// Verifies the caller is authenticated and is the owner of the status, then deletes
// the status document and any Cloudinary asset, and removes archive copies.
exports.deleteStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }

  const uid = context.auth.uid;
  const statusId = data && data.statusId;
  if (!statusId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing statusId');
  }

  const db = admin.firestore();
  const ref = db.collection('statuses').doc(statusId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'Status not found');
  }

  const status = snap.data();
  if (!status || status.userId !== uid) {
    throw new functions.https.HttpsError('permission-denied', 'Not allowed to delete this status');
  }

  try {
    const publicId = status.publicId || status.public_id;
    if (publicId) {
      const resourceType = status.type === 'video' ? 'video' : 'image';
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log('Cloudinary deleted for', publicId);
      } catch (err) {
        console.error('Cloudinary delete failed', publicId, err);
      }
    }

    // delete any archive copies
    try {
      const archivesQ = await db.collection('users').doc(uid).collection('archives').where('statusId', '==', statusId).get();
      const batch = db.batch();
      archivesQ.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.error('Failed to delete archive copies', err);
    }

    await ref.delete();

    return { success: true };
  } catch (err) {
    console.error('deleteStatus failed:', err);
    throw new functions.https.HttpsError('internal', 'Failed to delete status');
  }
});
