import { useState, useEffect, useCallback, useRef } from 'react';
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
  syncApplicationsWithDelta,
  fetchApplicationsFromSupabase,
  saveApplicationToSupabase,
  batchSaveApplicationsToSupabase,
  deleteApplicationFromSupabase,
  subscribeToApplicationsSupabase,
  getStoredEgressStats,
  STORAGE_KEYS
} from '../lib/supabase';

export function useApplications() {
  // Initialize with local cache or default initial data
  const [applications, setApplications] = useState<Application[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.APPS_CACHE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const nonMock = parsed.filter((a: Application) => !a.id.startsWith('APP-GARUT-00'));
          localStorage.setItem(STORAGE_KEYS.APPS_CACHE, JSON.stringify(nonMock));
          return nonMock;
        }
      }
    } catch (e) {
      console.warn('Could not read cached applications from localStorage', e);
    }
    return INITIAL_APPLICATIONS;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDataSource, setActiveDataSource] = useState<'SUPABASE' | 'FIRESTORE' | 'LOCAL'>('FIRESTORE');
  const [isDeltaSyncing, setIsDeltaSyncing] = useState(false);

  // Sync to localStorage cache
  const saveToLocalCache = (apps: Application[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.APPS_CACHE, JSON.stringify(apps));
    } catch (e) {
      console.warn('Could not save applications to localStorage cache', e);
    }
  };

  // High-efficiency delta synchronization runner
  const performSync = useCallback(async (forceFull: boolean = false) => {
    if (!isSupabaseConfigured) return;
    setIsDeltaSyncing(true);
    try {
      const cached = applications;
      const { data: syncedApps, isDelta, modifiedCount, isTableMissing, error: syncErr } = await syncApplicationsWithDelta(cached, forceFull);
      
      if (!syncErr && !isTableMissing && syncedApps.length > 0) {
        setApplications(syncedApps);
        saveToLocalCache(syncedApps);
        setActiveDataSource('SUPABASE');
        console.log(`[Egress Saver] Synced ${syncedApps.length} records (${isDelta ? `Delta: ${modifiedCount} modified` : 'Full sync'}).`);
      } else if (!syncErr && !isTableMissing && syncedApps.length === 0) {
        // Seed initial data if DB is completely empty and table exists
        console.log('Seeding initial applications to Supabase PostgreSQL...');
        const seedRes = await batchSaveApplicationsToSupabase(INITIAL_APPLICATIONS);
        if (seedRes.success) {
          setApplications(INITIAL_APPLICATIONS);
          saveToLocalCache(INITIAL_APPLICATIONS);
          setActiveDataSource('SUPABASE');
        }
      } else if (isTableMissing || syncErr) {
        setActiveDataSource('FIRESTORE');
      }
    } catch (err: any) {
      console.warn('Supabase delta sync deferred:', err?.message || err);
      setActiveDataSource('FIRESTORE');
    } finally {
      setIsDeltaSyncing(false);
      setLoading(false);
    }
  }, [applications]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeFirestore: (() => void) | null = null;
    let unsubscribeSupabase: (() => void) | null = null;

    const setupDataSources = async () => {
      setLoading(true);

      let supabaseActive = false;

      // --- 1. SUPABASE REALTIME PRIMARY SYNC WITH DELTA EGRESS SAVER ---
      if (isSupabaseConfigured) {
        try {
          // Read initial cached state
          let currentCache: Application[] = applications;
          try {
            const raw = localStorage.getItem(STORAGE_KEYS.APPS_CACHE);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) currentCache = parsed.filter((a: Application) => !a.id.startsWith('APP-GARUT-00'));
            }
          } catch {}

          const { data: syncedApps, isDelta, modifiedCount, isTableMissing, error: sbErr } = await syncApplicationsWithDelta(currentCache, false);

          if (isMounted && !sbErr && !isTableMissing && syncedApps.length > 0) {
            setApplications(syncedApps);
            saveToLocalCache(syncedApps);
            setActiveDataSource('SUPABASE');
            supabaseActive = true;
            setLoading(false);
          } else if (isMounted && !sbErr && !isTableMissing && syncedApps.length === 0) {
            console.log('Seeding initial applications to Supabase PostgreSQL...');
            const seedRes = await batchSaveApplicationsToSupabase(INITIAL_APPLICATIONS);
            if (seedRes.success && isMounted) {
              setApplications(INITIAL_APPLICATIONS);
              saveToLocalCache(INITIAL_APPLICATIONS);
              setActiveDataSource('SUPABASE');
              supabaseActive = true;
              setLoading(false);
            }
          }

          if (supabaseActive) {
            // Subscribe to live Postgres changes (only receives updated row delta)
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
          }
        } catch (sbEx) {
          console.info('Supabase initialization fallback to Firestore/Local:', sbEx);
        }
      }

      // --- 2. FIRESTORE SECONDARY & LIVE BACKUP SYNC ---
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
          if (!snapshot.empty) {
            const appsData: Application[] = [];
            snapshot.forEach((docSnap) => {
              appsData.push(docSnap.data() as Application);
            });
            // Update local state if Supabase is not active or hasn't loaded data
            if (!supabaseActive) {
              setApplications(appsData);
              saveToLocalCache(appsData);
              setActiveDataSource('FIRESTORE');
            }
          }
          setLoading(false);
        }, (err) => {
          console.warn('Firestore listener notice:', err);
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
    const withTimestamp: Application = {
      ...updatedApp,
      lastUpdated: new Date().toISOString()
    };

    // 1. Optimistic local state update
    setApplications(prev => {
      const idx = prev.findIndex(a => a.id === withTimestamp.id);
      let next: Application[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = withTimestamp;
      } else {
        next = [withTimestamp, ...prev];
      }
      saveToLocalCache(next);
      return next;
    });

    // 2. Persist to Supabase (Primary)
    if (isSupabaseConfigured) {
      try {
        await saveApplicationToSupabase(withTimestamp);
      } catch (err) {
        console.warn('Supabase save notice:', err);
      }
    }

    // 3. Persist to Firestore (Dual backup)
    try {
      const appRef = doc(db, 'applications', withTimestamp.id);
      await setDoc(appRef, withTimestamp, { merge: true });
    } catch (err) {
      console.warn('Firestore save notice:', err);
    }
  };

  const batchUpdateApplications = async (apps: Application[]) => {
    const nowIso = new Date().toISOString();
    const withTimestamps = apps.map(a => ({
      ...a,
      lastUpdated: a.lastUpdated || nowIso
    }));

    // 1. Optimistic local update
    setApplications(prev => {
      const map = new Map(prev.map(a => [a.id, a]));
      withTimestamps.forEach(a => map.set(a.id, a));
      const next = Array.from(map.values());
      saveToLocalCache(next);
      return next;
    });

    // 2. Persist to Supabase
    if (isSupabaseConfigured) {
      try {
        await batchSaveApplicationsToSupabase(withTimestamps);
      } catch (err) {
        console.warn('Supabase batch save notice:', err);
      }
    }

    // 3. Persist to Firestore
    try {
      await Promise.all(withTimestamps.map(app => setDoc(doc(db, 'applications', app.id), app, { merge: true })));
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
    activeDataSource,
    isDeltaSyncing,
    refreshApplications: performSync
  };
}
