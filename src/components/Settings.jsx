import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from '../firebase/auth';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImageUpload from './ImageUpload';
import { toast } from 'sonner';
import ResetAppButton from './ResetAppButton';
import Navbar from './Navbar';

const Settings = ({ onProfileUpdate = () => {}, setIsLoading = () => {} }) => {
  const { user, logout } = useFirebaseAuth();
  const [profile, setProfile] = useState({ name: '', surname: '', avatar_url: null });
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState('settings');
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (user) {
      try {
        setLocalLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile({
            name: userData.name || '',
            surname: userData.surname || '',
            avatar_url: userData.avatar_url || null
          });
          setUserRole(userData.role || 'user');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLocalLoading(false);
      }
    }
  };

  const handleProfileUpdate = async () => {
    if (user) {
      try {
        setLocalLoading(true);
        setIsLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          ...profile,
          updated_at: new Date()
        });
        toast.success('Profile updated successfully');
        onProfileUpdate(profile);
      } catch (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
      } finally {
        setLocalLoading(false);
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleClockingCleanup = async () => {
    try {
      setIsLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userIds = new Set(usersSnapshot.docs.map(doc => doc.id));

      const clockEntriesSnapshot = await getDocs(collection(db, 'clock_entries'));
      const batch = writeBatch(db);
      let deletedCount = 0;

      clockEntriesSnapshot.forEach(doc => {
        const entry = doc.data();
        if (!userIds.has(entry.user_id)) {
          batch.delete(doc.ref);
          deletedCount++;
        }
      });

      await batch.commit();
      toast.success(`Cleanup completed. Deleted ${deletedCount} orphaned clock entries.`);
    } catch (error) {
      console.error('Error during clocking cleanup:', error);
      toast.error('Failed to complete clocking cleanup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={logout}
        userRole={userRole}
      />
      <div className="container mx-auto p-4 flex-grow">
        <Card className="mx-auto mt-16 mb-8 bg-white">
          <CardHeader className="text-center">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={profile.avatar_url} alt={`${profile.name} ${profile.surname}`} className="object-cover" />
                <AvatarFallback>{profile.name?.charAt(0)}{profile.surname?.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle>Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={profile.name} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="surname">Surname</Label>
                <Input id="surname" name="surname" value={profile.surname} onChange={handleInputChange} />
              </div>
              <div>
                <Label>Profile Picture</Label>
                <ImageUpload 
                  onImageSelected={(url) => setProfile({ ...profile, avatar_url: url })} 
                  currentImage={profile.avatar_url}
                  setIsLoading={setIsLoading}
                />
              </div>
              <Button 
                onClick={handleProfileUpdate} 
                className="w-full"
                disabled={localLoading}
              >
                {localLoading ? 'Updating...' : 'Update Profile'}
              </Button>
              
              {userRole === 'admin' && (
                <>
                  <ResetAppButton setIsLoading={setIsLoading} />
                  <Button 
                    onClick={handleClockingCleanup} 
                    variant="outline" 
                    className="w-full"
                    disabled={localLoading}
                  >
                    Cleanup Orphaned Clock Entries
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;