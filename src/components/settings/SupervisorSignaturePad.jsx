import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useFirebaseAuth } from '../../firebase/auth';
import { toast } from 'sonner';

const SupervisorSignaturePad = () => {
  const sigPad = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const { user } = useFirebaseAuth();

  useEffect(() => {
    const fetchSignature = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        setSignatureUrl(userData?.supervisor_signature || null);
      }
    };
    fetchSignature();
  }, [user]);

  const clear = () => {
    if (sigPad.current) {
      sigPad.current.clear();
      setSignatureUrl(null);
    }
  };

  const save = async () => {
    if (!sigPad.current || sigPad.current.isEmpty()) {
      toast.error('Please provide a signature before saving');
      return;
    }

    try {
      setIsSaving(true);
      // Get signature as base64 PNG with transparent background
      const signatureData = sigPad.current.toDataURL('image/png');
      
      // Update user settings with signature
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'supervisor_signature': signatureData,
        'signature_updated_at': new Date().toISOString()
      });

      setSignatureUrl(signatureData);
      toast.success('Signature saved successfully');
    } catch (error) {
      console.error('Error saving signature:', error);
      toast.error('Failed to save signature');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supervisor Signature</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
            {signatureUrl ? (
              <div className="bg-white rounded-lg flex items-center justify-center">
                <img 
                  src={signatureUrl} 
                  alt="Saved Signature" 
                  className="max-h-[200px] w-auto object-contain"
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg">
                <SignatureCanvas
                  ref={sigPad}
                  canvasProps={{
                    className: "w-full h-[200px] rounded-lg",
                    style: {
                      width: '100%',
                      height: '200px'
                    }
                  }}
                  backgroundColor="rgba(255, 255, 255, 0)"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                clear();
                setSignatureUrl(null);
              }}
              disabled={isSaving}
            >
              {signatureUrl ? 'Change Signature' : 'Clear'}
            </Button>
            {!signatureUrl && (
              <Button 
                onClick={save}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Signature'}
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-500">
            This signature will be used on all timesheet PDFs you generate. 
            {!signatureUrl ? 'Draw your signature in the box above and click Save.' : 'Click Change Signature to draw a new one.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupervisorSignaturePad;
