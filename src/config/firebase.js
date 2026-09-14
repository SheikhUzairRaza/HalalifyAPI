import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let app = null;

/**
 * Initialize and get Firebase Admin App instance
 */
export const getFirebaseApp = () => {
  if (getApps().length > 0) {
    return getApp();
  }

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      app = initializeApp({
        credential: cert(serviceAccount),
      });
    } else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      app = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'halalfy-app',
      });
    }

    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.warn('Firebase Admin SDK initialization warning:', error.message);
  }

  return app;
};

// Initialize
getFirebaseApp();

/**
 * Verify Firebase ID Token received from Frontend Google Sign-In
 * @param {string} idToken
 * @returns {Promise<import('firebase-admin/auth').DecodedIdToken>}
 */
export const verifyFirebaseIdToken = async (idToken) => {
  const currentApp = getFirebaseApp();
  const auth = getAuth(currentApp);
  return auth.verifyIdToken(idToken);
};

export default { getFirebaseApp, verifyFirebaseIdToken };

