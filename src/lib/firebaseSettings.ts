import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  query, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { PrasaranaPriceConfig } from '../types';
import { PRASARANA_TYPES } from './retribusiData';

const SETTINGS_COLLECTION = 'settings/prasarana_prices/items';
const GLOBAL_SETTINGS_DOC = 'settings/global_config';

function sanitizeId(label: string): string {
  return label.replace(/\//g, '-');
}

export interface ParameterWeight {
  name: string;
  weight: number;
}

export interface GlobalSettings {
  shst: number;
  parameterWeights: ParameterWeight[];
  updatedAt: string;
  updatedBy: string;
}

export async function initializePrasaranaPrices() {
  // Initialize Prasarana Prices
  const snapshot = await getDocs(collection(db, SETTINGS_COLLECTION));
  if (snapshot.empty) {
    console.log('Seeding initial prasarana prices...');
    for (const item of PRASARANA_TYPES) {
      const config: PrasaranaPriceConfig = {
        id: sanitizeId(item.label),
        label: item.label,
        unit: item.unit,
        price: item.price,
        updatedAt: new Date().toISOString(),
        updatedBy: 'SYSTEM_INITIAL'
      };
      await setDoc(doc(db, SETTINGS_COLLECTION, config.id), config);
    }
  }

  // Initialize Global Config if not exists
  const globalDoc = await getDocs(collection(db, 'settings'));
  const hasGlobal = globalDoc.docs.some(d => d.id === 'global_config');
  if (!hasGlobal) {
    const initialWeights: ParameterWeight[] = [
      { name: 'Kompleksitas', weight: 0.25 },
      { name: 'Permanensi', weight: 0.20 },
      { name: 'Zonasi Gempa', weight: 0.15 },
      { name: 'Kepadatan', weight: 0.10 },
      { name: 'Ketinggian', weight: 0.10 },
      { name: 'Kepemilikan', weight: 0.05 },
      { name: 'Waktu Penggunaan', weight: 0.15 },
    ];

    await setDoc(doc(db, GLOBAL_SETTINGS_DOC), {
      shst: 5400000,
      parameterWeights: initialWeights,
      updatedAt: new Date().toISOString(),
      updatedBy: 'SYSTEM_INITIAL'
    });
  }
}

export function subscribeToGlobalSettings(callback: (settings: GlobalSettings) => void) {
  return onSnapshot(doc(db, GLOBAL_SETTINGS_DOC), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as GlobalSettings);
    }
  });
}

export async function updateSHST(price: number, user: string) {
  await setDoc(doc(db, GLOBAL_SETTINGS_DOC), {
    shst: price,
    updatedAt: new Date().toISOString(),
    updatedBy: user
  }, { merge: true });
}

export async function updateParameterWeights(weights: ParameterWeight[], user: string) {
  await setDoc(doc(db, GLOBAL_SETTINGS_DOC), {
    parameterWeights: weights,
    updatedAt: new Date().toISOString(),
    updatedBy: user
  }, { merge: true });
}

export function subscribeToPrasaranaPrices(callback: (prices: PrasaranaPriceConfig[]) => void) {
  const q = query(collection(db, SETTINGS_COLLECTION), orderBy('label', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const prices = snapshot.docs.map(doc => doc.data() as PrasaranaPriceConfig);
    callback(prices);
  });
}

export async function updatePrasaranaPrice(id: string, price: number, user: string) {
  // Ensure ID is sanitized even if a label is passed
  const docRef = doc(db, SETTINGS_COLLECTION, sanitizeId(id));
  await setDoc(docRef, {
    price,
    updatedAt: new Date().toISOString(),
    updatedBy: user
  }, { merge: true });
}
