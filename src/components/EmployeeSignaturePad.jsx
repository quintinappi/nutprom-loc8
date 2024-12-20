import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from './ui/button';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

const EmployeeSignaturePad = ({ userId }) => {
  const signaturePad = useRef(null);
  const [savedSignature, setSavedSignature] = useState(null);
  const [showPad, setShowPad] = useState(false);

  useEffect(() => {
    const loadSignature = async () => {
      if (!userId) return;
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists() && userDoc.data().employeeSignature) {
        setSavedSignature(userDoc.data().employeeSignature);
      }
    };
    loadSignature();
  }, [userId]);

  const saveSignature = async () => {
    if (!signaturePad.current || !userId) return;
    const signatureData = signaturePad.current.toDataURL();
    const db = getFirestore();
    await updateDoc(doc(db, 'users', userId), {
      employeeSignature: signatureData
    });
    setSavedSignature(signatureData);
    setShowPad(false);
  };

  const clearSignature = async () => {
    if (!userId) return;
    const db = getFirestore();
    await updateDoc(doc(db, 'users', userId), {
      employeeSignature: null
    });
    setSavedSignature(null);
    if (signaturePad.current) {
      signaturePad.current.clear();
    }
  };

  const handleClear = () => {
    if (signaturePad.current) {
      signaturePad.current.clear();
    }
  };

  if (!userId) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Employee Signature</h3>
        {savedSignature && !showPad && (
          <Button variant="outline" onClick={() => setShowPad(true)}>
            Change Signature
          </Button>
        )}
      </div>

      {!savedSignature && !showPad && (
        <Button onClick={() => setShowPad(true)}>Add Signature</Button>
      )}

      {showPad && (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="border rounded bg-white">
            <SignatureCanvas
              ref={signaturePad}
              canvasProps={{
                className: 'signature-canvas',
                style: { width: '100%', height: '200px' }
              }}
            />
          </div>
          <div className="flex space-x-2">
            <Button onClick={saveSignature}>Save</Button>
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
            <Button variant="outline" onClick={() => setShowPad(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {savedSignature && !showPad && (
        <div className="space-y-2">
          <div className="border rounded-lg p-4 bg-white">
            <img
              src={savedSignature}
              alt="Saved signature"
              className="max-h-[100px] w-auto mx-auto"
            />
          </div>
          <Button variant="outline" onClick={clearSignature}>
            Remove Signature
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmployeeSignaturePad;
