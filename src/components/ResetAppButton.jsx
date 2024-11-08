import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'sonner';

const ResetAppButton = ({ setIsLoading }) => {
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  const handleResetApp = async () => {
    try {
      setIsLoading(true);
      const clockEntriesRef = collection(db, 'clock_entries');
      const snapshot = await getDocs(clockEntriesRef);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const updatePromises = usersSnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          lastClockIn: null,
          lastClockOut: null,
        })
      );
      await Promise.all(updatePromises);

      toast.success('App reset successfully');
      setShowResetConfirmation(false);
    } catch (error) {
      console.error('Error resetting app:', error);
      toast.error('Failed to reset app');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {!showResetConfirmation ? (
        <Button onClick={() => setShowResetConfirmation(true)} variant="destructive">
          Reset App (Delete All Clocking Entries)
        </Button>
      ) : (
        <Alert variant="destructive">
          <AlertDescription>
            Are you sure you want to delete all clocking entries? This action cannot be undone.
            <div className="mt-2">
              <Button onClick={handleResetApp} variant="destructive" className="mr-2">
                Confirm Reset
              </Button>
              <Button onClick={() => setShowResetConfirmation(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ResetAppButton;