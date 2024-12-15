import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from '../firebase/auth';
import { db, auth } from '../firebase/config';
import { doc, getDoc, updateDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImageUpload from './ImageUpload';
import { toast } from 'sonner';
import ResetAppButton from './ResetAppButton';
import Navbar from './Navbar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Settings = ({ onProfileUpdate = () => {}, setIsLoading = () => {} }) => {
  const { user, logout } = useFirebaseAuth();
  const [profile, setProfile] = useState({ name: '', surname: '', avatar_url: null });
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState('settings');
  const [localLoading, setLocalLoading] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(null);

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
          setNewEmail(user.email || '');
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

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    setEmailError(null);
    
    try {
      setLocalLoading(true);
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Update email in Firebase Auth
      await updateEmail(user, newEmail);

      // Update email in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        email: newEmail
      });

      toast.success('Email updated successfully');
      setIsEmailDialogOpen(false);
      setPassword('');
    } catch (error) {
      console.error('Error updating email:', error);
      setEmailError(error.message);
      toast.error('Failed to update email');
    } finally {
      setLocalLoading(false);
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
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col items-center mb-6">
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarImage src={profile.avatar_url} alt={`${profile.name} ${profile.surname}`} className="object-cover" />
                  <AvatarFallback>{profile.name?.charAt(0)}{profile.surname?.charAt(0)}</AvatarFallback>
                </Avatar>
                <ImageUpload 
                  onImageSelected={(url) => setProfile({ ...profile, avatar_url: url })} 
                  currentImage={profile.avatar_url}
                  setIsLoading={setIsLoading}
                />
              </div>

              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={profile.name} onChange={handleInputChange} />
              </div>

              <div>
                <Label htmlFor="surname">Surname</Label>
                <Input id="surname" name="surname" value={profile.surname} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Update Email
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Email Address</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleEmailUpdate} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="newEmail">New Email</Label>
                          <Input
                            id="newEmail"
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Current Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        {emailError && (
                          <p className="text-sm text-red-500">{emailError}</p>
                        )}
                        <Button type="submit" className="w-full" disabled={localLoading}>
                          Update Email
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Button 
                onClick={handleProfileUpdate} 
                className="w-full"
                disabled={localLoading}
              >
                {localLoading ? 'Updating...' : 'Update Profile'}
              </Button>
              
              {userRole === 'admin' && (
                <div className="pt-4">
                  <ResetAppButton setIsLoading={setIsLoading} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;