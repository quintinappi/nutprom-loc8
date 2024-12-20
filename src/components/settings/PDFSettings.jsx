import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { useFirebaseAuth } from '../../firebase/auth';
import SupervisorSignaturePad from './SupervisorSignaturePad';

const PDFSettings = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const { user } = useFirebaseAuth();

  useEffect(() => {
    const fetchLogo = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        setLogoUrl(userData?.pdfSettings?.logoBase64);
      }
    };
    fetchLogo();
  }, [user]);

  const optimizeImage = (base64String, fileType) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Maintain aspect ratio while resizing if needed
        if (width > 600 || height > 200) {
          const ratio = Math.min(600 / width, 200 / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Clear the canvas with transparency
        ctx.clearRect(0, 0, width, height);
        
        // Draw the image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Use PNG with compression for transparency support
        const optimizedBase64 = canvas.toDataURL('image/png', 0.85);
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

    // Increase size limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      
      // Convert image to base64
      const base64String = await convertToBase64(file);
      
      // Optimize the image with compression
      const optimizedBase64 = await optimizeImage(base64String, file.type);

      // Update user document with the logo
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'pdfSettings.logoBase64': optimizedBase64,
        logoUpdatedAt: new Date().toISOString()
      });

      setLogoUrl(optimizedBase64);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo Settings */}
      <Card>
        <CardHeader>
          <CardTitle>PDF Logo Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Timesheet Logo</h3>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex items-center justify-center min-h-[120px] bg-gray-50">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Timesheet Logo" 
                    className="max-h-24 w-auto object-contain"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <p>No logo uploaded</p>
                    <p className="text-sm">Click below to upload</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('logo-upload').click()}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <p className="text-sm text-gray-500 mt-2">
                  This logo will appear on your exported PDF timesheets. 
                  Recommended size: 600x200px. Max file size: 5MB
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supervisor Signature */}
      <SupervisorSignaturePad />
    </div>
  );
};

export default PDFSettings;
