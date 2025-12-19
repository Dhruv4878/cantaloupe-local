# Firebase Service Account Setup

Place your Firebase Admin SDK service account key file here as:

  backend/src/config/serviceAccountKey.json

Never commit this file. It's ignored by .gitignore.

How to obtain:
- Go to Firebase Console > Project settings > Service accounts
- Click "Generate new private key" and download the JSON
- Save it to backend/src/config/serviceAccountKey.json
