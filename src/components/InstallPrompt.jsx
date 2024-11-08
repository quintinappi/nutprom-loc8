import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const InstallPrompt = ({ onDismiss }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    } else {
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
      onDismiss();
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    onDismiss();
  };

  if (!showPrompt) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleDismiss}></div>
      <Card className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
        <CardContent className="p-4">
          <p className="mb-4">Install NutProM for a better experience!</p>
          {deferredPrompt ? (
            <div className="flex justify-between">
              <Button onClick={handleInstall}>Install</Button>
              <Button variant="outline" onClick={handleDismiss}>Dismiss</Button>
            </div>
          ) : (
            <div>
              <p className="mb-2">To install NutProM:</p>
              <ol className="list-decimal list-inside mb-4">
                <li>Open this website in Chrome</li>
                <li>Tap the menu icon (⋮)</li>
                <li>Tap 'Add to Home screen'</li>
              </ol>
              <Button variant="outline" onClick={handleDismiss}>Got it</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default InstallPrompt;