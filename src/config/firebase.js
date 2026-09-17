import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from './env.js';

let app = null;

/**
 * Initialize and get Firebase Admin App instance
 */
export const getFirebaseApp = () => {
  if (getApps().length > 0) {
    return getApp();
  }

  try {
    if (env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey) {
      app = initializeApp({
        credential: cert({
          projectId: env.firebase.projectId,
          clientEmail: env.firebase.clientEmail,
          privateKey: env.firebase.privateKey,
        }),
      });
    } else {
      app = initializeApp({
        projectId: env.firebase.projectId || 'halalifyapi',
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
