import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../../firebase/config';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const CompanyLogoUpload = ({ companyId, currentLogoUrl, onLogoUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size should be less than 2MB');
      return;
    }

    try {
      setIsUploading(true);

      // Create a reference to the storage location
      const storageRef = ref(storage, `company-logos/${companyId}/${file.name}`);

      // Upload the file
      await uploadBytes(storageRef, file);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update company document with new logo URL
      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, {
        logoUrl: downloadURL,
        logoUpdatedAt: new Date().toISOString()
      });

      // Call the callback with new URL
      onLogoUpdate(downloadURL);
      
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {currentLogoUrl && (
          <img 
            src={currentLogoUrl} 
            alt="Company Logo" 
            className="h-16 w-auto object-contain"
          />
        )}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => document.getElementById('logo-upload').click()}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload New Logo'}
          </Button>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <p className="text-sm text-gray-500">
            Recommended size: 300x100px. Max file size: 2MB
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanyLogoUpload;
