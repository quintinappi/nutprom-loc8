import React, { useState } from 'react';
import ExportCSV from '../components/ExportCSV';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from '../components/Navbar';
import { useFirebaseAuth } from '../firebase/auth';

const ExportCSVPage = () => {
  const [activeTab, setActiveTab] = useState('export-csv');
  const { user, logout } = useFirebaseAuth();
  const [userRole, setUserRole] = useState('admin'); // Assuming admin role for now

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
          <CardHeader>
            <CardTitle>Export CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <h1 className="text-3xl font-bold mb-4">Welcome to the Export CSV Page</h1>
            <p className="text-lg mb-6">This page allows you to export your clock entries as a CSV file.</p>
            {user && <ExportCSV userId={user.uid} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExportCSVPage;