import { initializeApp, getApps, cert, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

function getApp(): App {
  if (getApps().length) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  // Fallback for environments with Application Default Credentials (e.g. GCP)
  if (projectId) {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  // Minimal init for build time — will fail at runtime if used without credentials
  return initializeApp({ projectId: 'placeholder-build' });
}

let _db: Firestore | null = null;
let _storage: Storage | null = null;

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    if (!_db) {
      _db = getFirestore(getApp());
    }
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const adminStorage: Storage = new Proxy({} as Storage, {
  get(_, prop) {
    if (!_storage) {
      _storage = getStorage(getApp());
    }
    return (_storage as unknown as Record<string | symbol, unknown>)[prop];
  },
});
