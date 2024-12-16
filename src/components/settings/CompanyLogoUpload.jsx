import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const CompanyLogoUpload = ({ companyId, currentLogoUrl, onLogoUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);

  const optimizeImage = (base64String) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Maintain aspect ratio while resizing if needed
        if (width > 300 || height > 100) {
          const ratio = Math.min(300 / width, 100 / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with reduced quality
        const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(optimizedBase64);
      };
      img.onerror = reject;
      img.src = base64String;
    });
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

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
      
      // Convert image to base64
      const base64String = await convertToBase64(file);
      
      // Optimize the image
      const optimizedBase64 = await optimizeImage(base64String);

      // Update company document with optimized base64 logo
      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, {
        'pdfSettings.logoBase64': optimizedBase64,
        logoUpdatedAt: new Date().toISOString()
      });

      // Call the callback with new optimized base64 string
      onLogoUpdate(optimizedBase64);
      
      toast.success('Logo uploaded and optimized successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex items-center justify-center min-h-[120px] bg-gray-50">
          {currentLogoUrl ? (
            <img 
              src={currentLogoUrl} 
              alt="Company Logo" 
              className="max-h-24 w-auto object-contain"
            />
          ) : (
            <div className="text-center text-gray-500">
              <p>No logo uploaded</p>
              <p className="text-sm">Click below to upload</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => document.getElementById('logo-upload').click()}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? 'Uploading...' : currentLogoUrl ? 'Change Logo' : 'Upload Logo'}
          </Button>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyLogoUpload;
