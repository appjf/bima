import { 
  collection, 
  doc, 
  getDoc,
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
  const existingIds = new Set(snapshot.docs.map(doc => doc.id));
  const initializedItems: PrasaranaPriceConfig[] = [];

  console.log('Checking for missing prasarana prices...');
  for (const item of PRASARANA_TYPES) {
    const id = sanitizeId(item.label);
    if (!existingIds.has(id)) {
      console.log(`Adding missing item: ${item.label}`);
      const config: PrasaranaPriceConfig = {
        id,
        label: item.label,
        unit: item.unit,
        price: item.price,
        updatedAt: new Date().toISOString(),
        updatedBy: 'SYSTEM_INITIAL'
      };
      await setDoc(doc(db, SETTINGS_COLLECTION, id), config);
      initializedItems.push(config);
    }
  }

  // Sync newly added items to Supabase
  if (initializedItems.length > 0) {
    try {
      const { syncPrasaranaPricesToSupabase } = await import('./supabase');
      await syncPrasaranaPricesToSupabase(initializedItems);
    } catch (err) {
      console.error('Failed to sync initialized prices to Supabase:', err);
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
  const docId = sanitizeId(id);
  const docRef = doc(db, SETTINGS_COLLECTION, docId);
  const updatedAt = new Date().toISOString();

  await setDoc(docRef, {
    price,
    updatedAt,
    updatedBy: user
  }, { merge: true });

  // Sync to Supabase as well
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const fullData = snap.data() as PrasaranaPriceConfig;
      const { syncPrasaranaPricesToSupabase } = await import('./supabase');
      await syncPrasaranaPricesToSupabase([fullData]);
    }
  } catch (err) {
    console.error('Failed to sync updated prasarana price to Supabase:', err);
  }
}

export async function resetPrasaranaToDefaults(user: string) {
  console.log('Resetting prasarana prices to defaults...');
  const resetItems: PrasaranaPriceConfig[] = [];
  
  for (const item of PRASARANA_TYPES) {
    const id = sanitizeId(item.label);
    const config: PrasaranaPriceConfig = {
      id,
      label: item.label,
      unit: item.unit,
      price: item.price,
      updatedAt: new Date().toISOString(),
      updatedBy: user
    };
    await setDoc(doc(db, SETTINGS_COLLECTION, id), config);
    resetItems.push(config);
  }

  // Sync all reset items to Supabase
  try {
    const { syncPrasaranaPricesToSupabase } = await import('./supabase');
    await syncPrasaranaPricesToSupabase(resetItems);
  } catch (err) {
    console.error('Failed to sync reset prasarana prices to Supabase:', err);
  }
}

export async function importPricesToFirestore(prices: PrasaranaPriceConfig[]) {
  for (const item of prices) {
    const id = sanitizeId(item.id || item.label);
    const config: PrasaranaPriceConfig = {
      id,
      label: item.label,
      unit: item.unit,
      price: item.price,
      updatedAt: item.updatedAt || new Date().toISOString(),
      updatedBy: item.updatedBy || 'SYSTEM_IMPORT'
    };
    await setDoc(doc(db, SETTINGS_COLLECTION, id), config);
  }
}
