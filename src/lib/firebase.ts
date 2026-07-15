import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID ?? '',
};

let app: FirebaseApp | undefined;

export function getFirebaseApp() {
  if (!firebaseConfig.projectId) {
    return undefined;
  }

  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }

  return app;
}

export function getFirebaseDb() {
  const firebaseApp = getFirebaseApp();

  if (!firebaseApp) {
    throw new Error('Firebase is not configured yet.');
  }

  return getFirestore(firebaseApp);
}

function normalizeWord(text: string) {
  return text.trim().toLowerCase();
}

export async function saveWord(text: string) {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error('Please enter a word before sending.');
  }

  const db = getFirebaseDb();
  const normalized = normalizeWord(trimmed);
  const wordRef = doc(db, 'words', normalized);
  const wordSnapshot = await getDoc(wordRef);

  if (wordSnapshot.exists()) {
    await updateDoc(wordRef, {
      count: increment(1),
      lastSubmittedAt: serverTimestamp(),
      latestValue: trimmed,
    });
  } else {
    await setDoc(wordRef, {
      text: trimmed,
      normalizedText: normalized,
      count: 1,
      createdAt: serverTimestamp(),
      lastSubmittedAt: serverTimestamp(),
    });
  }

  const submissionRef = await addDoc(collection(db, 'submissions'), {
    text: trimmed,
    normalizedText: normalized,
    createdAt: serverTimestamp(),
    source: 'rtm-cloud',
  });

  return { id: submissionRef.id, wordId: normalized };
}
