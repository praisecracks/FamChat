Cloud Function: delete Cloudinary assets when a status is removed

Steps to configure & deploy:

1. Set your Cloudinary credentials in Firebase functions config (recommended):

   firebase functions:config:set cloudinary.cloud_name="YOUR_CLOUD_NAME" \
     cloudinary.api_key="YOUR_API_KEY" \
     cloudinary.api_secret="YOUR_API_SECRET"

   OR set environment variables on your CI/CD environment: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

2. From the `functions` folder run:

   npm install
   firebase deploy --only functions

Notes:
- This function listens to deletions in `statuses/{statusId}` and will attempt to delete the Cloudinary public id recorded in the `publicId` field.
- If you enable Firestore TTL on `expiresAt`, TTL deletions will also trigger this function (Firestore emits delete events for TTL deletions).
