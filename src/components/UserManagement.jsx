import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import Navbar from './Navbar';
import { useFirebaseAuth } from '../firebase/auth';
import { KeyRound } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const UserManagement = ({ onUserDeleted }) => {
  const [users, setUsers] = useState([]);
  const [editingCode, setEditingCode] = useState(null);
  const [newCode, setNewCode] = useState('');
  const { user, logout } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    });
    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });
      toast.success('Role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleCodeEdit = (userId, currentCode) => {
    setEditingCode(userId);
    setNewCode(currentCode);
  };

  const handleCodeSave = async (userId) => {
    try {
      // Check if code is 4 digits
      if (!/^\d{4}$/.test(newCode)) {
        toast.error('Code must be exactly 4 digits');
        return;
      }

      // Check if code is already in use by another user
      const codeQuery = query(
        collection(db, 'users'), 
        where('code', '==', newCode)
      );
      const codeSnapshot = await getDocs(codeQuery);
      
      if (!codeSnapshot.empty && codeSnapshot.docs[0].id !== userId) {
        toast.error('This code is already in use by another user');
        return;
      }

      await updateDoc(doc(db, 'users', userId), {
        code: newCode
      });
      
      setEditingCode(null);
      setNewCode('');
      toast.success('Code updated successfully');
    } catch (error) {
      console.error('Error updating code:', error);
      toast.error('Failed to update code');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        onUserDeleted();
        toast.success('User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  const handleResetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent successfully');
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error('Failed to send password reset email');
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col">
      <Navbar 
        onLogout={logout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole="admin"
      />
      <div className="container mx-auto p-4 flex-grow">
        <Card className="mx-auto mt-16 mb-8 bg-white">
          <CardHeader>
            <CardTitle>Manage Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Change Role</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue>{user.role}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {editingCode === user.id ? (
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value)}
                            maxLength={4}
                            pattern="\d*"
                            className="w-24"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCodeSave(user.id)}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <span>{user.code}</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCodeEdit(user.id, user.code)}
                          >
                            Edit
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <KeyRound className="h-4 w-4 mr-2" />
                              Reset
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reset Password</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will send a password reset email to {user.email}. The user will need to click the link in the email to set a new password.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleResetPassword(user.email)}
                              >
                                Send Reset Email
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;