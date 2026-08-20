import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  query, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Application } from '../types';
import { INITIAL_APPLICATIONS } from '../data/initialData';
import { 
  getSupabaseClient, 
  isSupabaseConfigured,
  fetchApplicationsFromSupabase,
  saveApplicationToSupabase,
  batchSaveApplicationsToSupabase,
  deleteApplicationFromSupabase,
  subscribeToApplicationsSupabase
} from '../lib/supabase';

const STORAGE_CACHE_KEY = 'simbg_garut_cached_apps';

export function useApplications() {
  // Initialize with local cache or default initial data
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
  const [activeDataSource, setActiveDataSource] = useState<'SUPABASE' | 'FIRESTORE' | 'LOCAL'>(
    isSupabaseConfigured ? 'SUPABASE' : 'FIRESTORE'
  );

  // Sync to localStorage whenever applications state updates
  const saveToLocalCache = (apps: Application[]) => {
    try {
      localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(apps));
    } catch (e) {
      console.warn('Could not save applications to localStorage cache', e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let unsubscribeFirestore: (() => void) | null = null;
    let unsubscribeSupabase: (() => void) | null = null;

    const setupDataSources = async () => {
      setLoading(true);

      // --- 1. SUPABASE REALTIME PRIMARY SYNC ---
      if (isSupabaseConfigured) {
        try {
          const { data: supabaseApps, error: sbErr } = await fetchApplicationsFromSupabase();
          if (isMounted && !sbErr && supabaseApps.length > 0) {
            setApplications(supabaseApps);
            saveToLocalCache(supabaseApps);
            setActiveDataSource('SUPABASE');
            setLoading(false);
          } else if (isMounted && !sbErr && supabaseApps.length === 0) {
            // Seed initial data to Supabase if table is empty
            console.log('Seeding initial applications to Supabase PostgreSQL...');
            await batchSaveApplicationsToSupabase(INITIAL_APPLICATIONS);
            if (isMounted) {
              setApplications(INITIAL_APPLICATIONS);
              saveToLocalCache(INITIAL_APPLICATIONS);
              setActiveDataSource('SUPABASE');
              setLoading(false);
            }
          }

          // Subscribe to live Postgres changes
          unsubscribeSupabase = subscribeToApplicationsSupabase(
            (updatedOrNewApp) => {
              if (!isMounted) return;
              setApplications(prev => {
                const idx = prev.findIndex(a => a.id === updatedOrNewApp.id);
                let next: Application[];
                if (idx >= 0) {
                  next = [...prev];
                  next[idx] = updatedOrNewApp;
                } else {
                  next = [updatedOrNewApp, ...prev];
                }
                saveToLocalCache(next);
                return next;
              });
            },
            (deletedId) => {
              if (!isMounted) return;
              setApplications(prev => {
                const next = prev.filter(a => a.id !== deletedId);
                saveToLocalCache(next);
                return next;
              });
            }
          );
        } catch (sbEx) {
          console.warn('Supabase initialization fallback to Firestore/Local:', sbEx);
        }
      }

      // --- 2. FIRESTORE SECONDARY & OFFLINE-FALLBACK SYNC ---
      try {
        const appsRef = collection(db, 'applications');
        const q = query(appsRef, orderBy('registerNumber', 'desc'));

        // Initial seeding check for Firestore
        const seedFirestoreIfEmpty = async () => {
          try {
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
              for (const app of INITIAL_APPLICATIONS) {
                await setDoc(doc(db, 'applications', app.id), app);
              }
            }
          } catch (err) {
            // Silent fallback if offline
          }
        };

        seedFirestoreIfEmpty();

        unsubscribeFirestore = onSnapshot(q, (snapshot) => {
          if (!isMounted) return;
          if (!snapshot.empty && !isSupabaseConfigured) {
            const appsData: Application[] = [];
            snapshot.forEach((docSnap) => {
              appsData.push(docSnap.data() as Application);
            });
            setApplications(appsData);
            saveToLocalCache(appsData);
            setActiveDataSource('FIRESTORE');
          }
          setLoading(false);
        }, (err) => {
          console.warn('Firestore listener fallback notice:', err);
          setLoading(false);
        });

      } catch (err: any) {
        console.warn('Firestore fallback warning:', err);
        setLoading(false);
      }
    };

    setupDataSources();

    return () => {
      isMounted = false;
      if (unsubscribeFirestore) unsubscribeFirestore();
      if (unsubscribeSupabase) unsubscribeSupabase();
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

    // 2. Persist to Supabase (Primary)
    if (isSupabaseConfigured) {
      try {
        await saveApplicationToSupabase(updatedApp);
      } catch (err) {
        console.warn('Supabase save notice:', err);
      }
    }

    // 3. Persist to Firestore (Dual backup)
    try {
      const appRef = doc(db, 'applications', updatedApp.id);
      await setDoc(appRef, updatedApp, { merge: true });
    } catch (err) {
      console.warn('Firestore save notice:', err);
    }
  };

  const batchUpdateApplications = async (apps: Application[]) => {
    // 1. Optimistic local update
    setApplications(prev => {
      const map = new Map(prev.map(a => [a.id, a]));
      apps.forEach(a => map.set(a.id, a));
      const next = Array.from(map.values());
      saveToLocalCache(next);
      return next;
    });

    // 2. Persist to Supabase
    if (isSupabaseConfigured) {
      try {
        await batchSaveApplicationsToSupabase(apps);
      } catch (err) {
        console.warn('Supabase batch save notice:', err);
      }
    }

    // 3. Persist to Firestore
    try {
      await Promise.all(apps.map(app => setDoc(doc(db, 'applications', app.id), app, { merge: true })));
    } catch (err) {
      console.warn('Firestore batch notice:', err);
    }
  };

  const deleteApplication = async (appId: string) => {
    // 1. Optimistic local update
    setApplications(prev => {
      const next = prev.filter(a => a.id !== appId);
      saveToLocalCache(next);
      return next;
    });

    // 2. Persist to Supabase
    if (isSupabaseConfigured) {
      try {
        await deleteApplicationFromSupabase(appId);
      } catch (err) {
        console.warn('Supabase delete notice:', err);
      }
    }

    // 3. Persist to Firestore
    try {
      const { deleteDoc } = await import('firebase/firestore');
      const appRef = doc(db, 'applications', appId);
      await deleteDoc(appRef);
    } catch (err) {
      console.warn('Firestore delete notice:', err);
    }
  };

  return { 
    applications, 
    updateApplication, 
    batchUpdateApplications, 
    deleteApplication, 
    loading, 
    error,
    activeDataSource
  };
}
