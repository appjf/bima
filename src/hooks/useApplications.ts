import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Application } from '../types';
import { INITIAL_APPLICATIONS } from '../data/initialData';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_CACHE_KEY = 'simbg_garut_cached_apps';

export function useApplications() {
  // Initialize with local cache or default mock to avoid any blank screen
  const [applications, setApplications] = useState<Application[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read cached applications from localStorage', e);
    }
    return INITIAL_APPLICATIONS;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync to localStorage whenever applications state updates
  const saveToLocalCache = (apps: Application[]) => {
    try {
      localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(apps));
    } catch (e) {
      console.warn('Could not save applications to localStorage cache', e);
    }
  };

  useEffect(() => {
    // Firestore listener with fallback
    let isMounted = true;
    let unsubscribeFirestore: (() => void) | null = null;

    const setupDataSources = async () => {
      try {
        const appsRef = collection(db, 'applications');
        const q = query(appsRef, orderBy('registerNumber', 'desc'));

        // Initial check for seeding Firestore if empty
        const seedIfEmpty = async () => {
          try {
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
              console.log('Seeding initial applications to Firestore...');
              for (const app of INITIAL_APPLICATIONS) {
                await setDoc(doc(db, 'applications', app.id), app);
              }
            }
          } catch (err) {
            console.warn('Firestore seeding check skipped (offline/unconfigured):', err);
          }
        };

        seedIfEmpty();

        unsubscribeFirestore = onSnapshot(q, (snapshot) => {
          if (!isMounted) return;
          if (!snapshot.empty) {
            const appsData: Application[] = [];
            snapshot.forEach((docSnap) => {
              appsData.push(docSnap.data() as Application);
            });
            setApplications(appsData);
            saveToLocalCache(appsData);
          }
          setLoading(false);
        }, (err) => {
          console.warn('Firestore real-time listener error, relying on local/Supabase cache:', err);
          setLoading(false);
        });

      } catch (err: any) {
        console.warn('Firestore initialization warning:', err);
        setLoading(false);
      }
    };

    setupDataSources();

    return () => {
      isMounted = false;
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  const updateApplication = async (updatedApp: Application) => {
    // 1. Optimistic local state update
    setApplications(prev => {
      const idx = prev.findIndex(a => a.id === updatedApp.id);
      let next: Application[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = updatedApp;
      } else {
        next = [updatedApp, ...prev];
      }
      saveToLocalCache(next);
      return next;
    });

    // 2. Persist to Firestore
    try {
      const appRef = doc(db, 'applications', updatedApp.id);
      await setDoc(appRef, updatedApp, { merge: true });
    } catch (err) {
      console.warn('Firestore update warning:', err);
    }

    // 3. Persist to Supabase if configured
    try {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured) {
        await supabase
          .from('applications')
          .upsert({
            id: updatedApp.id,
            register_number: updatedApp.registerNumber,
            applicant_name: updatedApp.applicant.name,
            building_name: updatedApp.building.name,
            function_type: updatedApp.building.functionType,
            district: updatedApp.building.district,
            permit_type: updatedApp.permitType,
            status: updatedApp.status,
            is_archived: updatedApp.isArchived || false,
            archived_at: updatedApp.archivedAt || null,
            archived_by: updatedApp.archivedBy || null,
            retribution_final: updatedApp.retribution?.finalRetribution || 0,
            retribution_status: updatedApp.retribution?.status || 'DRAFT',
            raw_json: updatedApp,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
      }
    } catch (err) {
      console.warn('Supabase upsert warning:', err);
    }
  };

  const batchUpdateApplications = async (apps: Application[]) => {
    // Optimistic local update
    setApplications(prev => {
      const map = new Map(prev.map(a => [a.id, a]));
      apps.forEach(a => map.set(a.id, a));
      const next = Array.from(map.values());
      saveToLocalCache(next);
      return next;
    });

    try {
      await Promise.all(apps.map(app => setDoc(doc(db, 'applications', app.id), app, { merge: true })));
    } catch (err) {
      console.warn('Firestore batch update warning:', err);
    }
  };

  const deleteApplication = async (appId: string) => {
    setApplications(prev => {
      const next = prev.filter(a => a.id !== appId);
      saveToLocalCache(next);
      return next;
    });

    try {
      const { deleteDoc } = await import('firebase/firestore');
      const appRef = doc(db, 'applications', appId);
      await deleteDoc(appRef);
    } catch (err) {
      console.warn('Firestore delete warning:', err);
    }

    try {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured) {
        await supabase.from('applications').delete().eq('id', appId);
      }
    } catch (err) {
      console.warn('Supabase delete warning:', err);
    }
  };

  return { applications, updateApplication, batchUpdateApplications, deleteApplication, loading, error };
}
