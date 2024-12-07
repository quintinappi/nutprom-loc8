import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { auth } from '../firebase/config';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

const PasswordUpdateDialog = ({ isOpen, onClose, userEmail }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      const user = auth.currentUser;
      
      // Create credentials with current password
      const credential = EmailAuthProvider.credential(
        userEmail,
        currentPassword
      );

      // Re-authenticate
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      onClose();
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else {
        toast.error('Failed to update password: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      setCurrentPassword('');
      setNewPassword('');
      onClose();
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Password</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePassword} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordUpdateDialog;