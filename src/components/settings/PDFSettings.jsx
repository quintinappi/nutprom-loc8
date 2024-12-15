import React from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CompanyLogoUpload from './CompanyLogoUpload';
import { toast } from 'sonner';

const PDFSettings = ({ company }) => {
  const handleLogoUpdate = async (newLogoUrl) => {
    try {
      const companyRef = doc(db, 'companies', company.id);
      await updateDoc(companyRef, {
        'pdfSettings.logoUrl': newLogoUrl
      });
    } catch (error) {
      console.error('Error updating PDF settings:', error);
      toast.error('Failed to update PDF settings');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PDF Export Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Company Logo</h3>
            <CompanyLogoUpload
              companyId={company.id}
              currentLogoUrl={company.pdfSettings?.logoUrl}
              onLogoUpdate={handleLogoUpdate}
            />
          </div>
          
          {/* Add more PDF settings here as needed */}
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFSettings;
