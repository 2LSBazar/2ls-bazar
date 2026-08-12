import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig.js";

const isConfigured = Object.values(firebaseConfig).every(
  (v) => v && v !== "REPLACE_ME"
);

function installLocalStorageShim() {
  console.warn(
    "[2LS Bazar] Firebase কনফিগার করা হয়নি — আপাতত localStorage ব্যবহার হচ্ছে (শুধু এই ব্রাউজারে সেভ থাকবে). src/firebaseConfig.js ফাইলে তোমার Firebase কনফিগ বসাও।"
  );
  window.storage = {
    get: async (key, shared) => {
      const raw = localStorage.getItem(key);
      return raw !== null ? { key, value: raw, shared: !!shared } : null;
    },
    set: async (key, value, shared) => {
      localStorage.setItem(key, value);
      return { key, value, shared: !!shared };
    },
    delete: async (key, shared) => {
      localStorage.removeItem(key);
      return { key, deleted: true, shared: !!shared };
    },
    list: async (prefix, shared) => {
      const keys = Object.keys(localStorage).filter(
        (k) => !prefix || k.startsWith(prefix)
      );
      return { keys, prefix, shared: !!shared };
    },
  };
}

function installFirestoreShim() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const COLLECTION = "shared_kv";

  window.storage = {
    get: async (key, shared) => {
      const ref = doc(db, COLLECTION, key);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return { key, value: snap.data().value, shared: !!shared };
    },
    set: async (key, value, shared) => {
      const ref = doc(db, COLLECTION, key);
      await setDoc(ref, { value, updatedAt: Date.now() });
      return { key, value, shared: !!shared };
    },
    delete: async (key, shared) => {
      const ref = doc(db, COLLECTION, key);
      await deleteDoc(ref);
      return { key, deleted: true, shared: !!shared };
    },
    list: async (prefix, shared) => {
      const snap = await getDocs(collection(db, COLLECTION));
      const keys = snap.docs
        .map((d) => d.id)
        .filter((k) => !prefix || k.startsWith(prefix));
      return { keys, prefix, shared: !!shared };
    },
  };
}

export function initStorage() {
  if (isConfigured) {
    try {
      installFirestoreShim();
      return;
    } catch (e) {
      console.error("[2LS Bazar] Firebase চালু করা যায়নি, localStorage ব্যবহার হচ্ছে:", e);
    }
  }
  installLocalStorageShim();
}
