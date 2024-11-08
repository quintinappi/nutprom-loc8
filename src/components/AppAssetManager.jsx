import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const AppAssetManager = ({ setIsLoading }) => {
  const [appLogo, setAppLogo] = useState(null);
  const [appIcon, setAppIcon] = useState(null);

  useEffect(() => {
    fetchAppAssets();
  }, []);

  const fetchAppAssets = async () => {
    const assetsDoc = await getDoc(doc(db, 'app_assets', 'main'));
    if (assetsDoc.exists()) {
      const assets = assetsDoc.data();
      setAppLogo(assets.logo || null);
      setAppIcon(assets.icon || null);
    }
  };

  const handleAssetUpload = async (event, assetType) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const base64Image = await convertToBase64(file);
      const assetsDocRef = doc(db, 'app_assets', 'main');
      await setDoc(assetsDocRef, {
        [assetType]: base64Image
      }, { merge: true });

      if (assetType === 'logo') {
        setAppLogo(base64Image);
      } else if (assetType === 'icon') {
        setAppIcon(base64Image);
      }

      toast.success(`App ${assetType} updated successfully`);
      updateManifest(assetType, base64Image);
    } catch (error) {
      console.error(`Error uploading ${assetType}:`, error);
      toast.error(`Failed to update app ${assetType}`);
    } finally {
      setIsLoading(false);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const updateManifest = async (assetType, base64Image) => {
    try {
      const manifestResponse = await fetch('/manifest.json');
      const manifest = await manifestResponse.json();

      if (assetType === 'icon') {
        manifest.icons = [
          {
            src: '/api/get-app-icon',
            sizes: "192x192 512x512",
            type: "image/png"
          }
        ];
      }

      const assetsDocRef = doc(db, 'app_assets', 'manifest');
      await setDoc(assetsDocRef, { manifest: JSON.stringify(manifest) });

      console.log('Manifest updated successfully');
    } catch (error) {
      console.error('Error updating manifest:', error);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-2">App Assets</h3>
      <div className="space-y-4">
        <div>
          <Label>App Logo</Label>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => document.getElementById('logoInput').click()}
              variant="outline"
            >
              Upload Image
            </Button>
            <input
              id="logoInput"
              type="file"
              accept="image/*"
              onChange={(e) => handleAssetUpload(e, 'logo')}
              className="hidden"
            />
          </div>
          {appLogo && (
            <div className="mt-2">
              <img src={appLogo} alt="App Logo" className="w-24 h-24 object-contain" />
            </div>
          )}
        </div>
        <div>
          <Label>App Icon</Label>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => document.getElementById('iconInput').click()}
              variant="outline"
            >
              Upload Image
            </Button>
            <input
              id="iconInput"
              type="file"
              accept="image/*"
              onChange={(e) => handleAssetUpload(e, 'icon')}
              className="hidden"
            />
          </div>
          {appIcon && (
            <div className="mt-2">
              <img src={appIcon} alt="App Icon" className="w-24 h-24 object-contain" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppAssetManager;