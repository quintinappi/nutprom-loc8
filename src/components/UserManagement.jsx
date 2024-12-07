import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import Navbar from './Navbar';
import { useFirebaseAuth } from '../firebase/auth';
import UserTableRow from './UserTableRow';
import PasswordUpdateDialog from './PasswordUpdateDialog';

const UserManagement = ({ onUserDeleted }) => {
  const [users, setUsers] = useState([]);
  const [editingCode, setEditingCode] = useState(null);
  const [newCode, setNewCode] = useState('');
  const { user, logout } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

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
      if (!/^\d{4}$/.test(newCode)) {
        toast.error('Code must be exactly 4 digits');
        return;
      }

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

  const handleUpdatePassword = (user) => {
    setSelectedUser(user);
    setIsPasswordDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar 
        onLogout={logout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole="admin"
      />
      <div className="container mx-auto p-4 flex-grow">
        <Card className="mx-auto mt-8 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Manage Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Change Role</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    editingCode={editingCode}
                    newCode={newCode}
                    onRoleChange={handleRoleChange}
                    onCodeEdit={handleCodeEdit}
                    onCodeSave={handleCodeSave}
                    onNewCodeChange={setNewCode}
                    onUpdatePassword={handleUpdatePassword}
                    onDelete={handleDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {selectedUser && (
        <PasswordUpdateDialog
          isOpen={isPasswordDialogOpen}
          onClose={() => {
            setIsPasswordDialogOpen(false);
            setSelectedUser(null);
          }}
          userEmail={selectedUser.email}
        />
      )}
    </div>
  );
};

export default UserManagement;