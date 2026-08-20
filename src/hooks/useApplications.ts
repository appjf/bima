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

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const appsRef = collection(db, 'applications');
    const q = query(appsRef, orderBy('registerNumber', 'desc'));

    // Initial check for seeding
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
        console.error('Error seeding applications:', err);
      }
    };

    seedIfEmpty();

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appsData: Application[] = [];
      snapshot.forEach((doc) => {
        appsData.push(doc.data() as Application);
      });
      setApplications(appsData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'applications');
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateApplication = async (updatedApp: Application) => {
    try {
      const appRef = doc(db, 'applications', updatedApp.id);
      await setDoc(appRef, updatedApp, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `applications/${updatedApp.id}`);
    }
  };

  const batchUpdateApplications = async (apps: Application[]) => {
    try {
      // For simplicity, we use Promise.all. For larger sets, use WriteBatch.
      await Promise.all(apps.map(app => setDoc(doc(db, 'applications', app.id), app, { merge: true })));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'applications_batch');
    }
  };

  const deleteApplication = async (appId: string) => {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      const appRef = doc(db, 'applications', appId);
      await deleteDoc(appRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `applications/${appId}`);
    }
  };

  return { applications, updateApplication, batchUpdateApplications, deleteApplication, loading, error };
}
