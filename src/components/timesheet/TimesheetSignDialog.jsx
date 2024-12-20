import { useState, useRef } from 'react';
import SignaturePad from 'react-signature-canvas';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const TimesheetSignDialog = ({ open, onClose, timesheet, onSignComplete }) => {
  const [signature, setSignature] = useState(null);
  const signaturePadRef = useRef(null);

  const handleClear = () => {
    signaturePadRef.current?.clear();
    setSignature(null);
  };

  const handleSave = async () => {
    if (!signaturePadRef.current?.isEmpty()) {
      try {
        const signatureData = signaturePadRef.current.toDataURL();
        const timesheetRef = doc(db, 'timesheets', timesheet.id);
        
        await updateDoc(timesheetRef, {
          employeeSignature: signatureData,
          status: 'PENDING_SUPERVISOR',
          signedAt: new Date().toISOString()
        });

        toast.success('Timesheet signed successfully');
        onSignComplete();
      } catch (error) {
        console.error('Error saving signature:', error);
        toast.error('Failed to save signature');
      }
    } else {
      toast.error('Please provide a signature');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] w-full p-4">
        <DialogHeader>
          <DialogTitle>Sign Timesheet</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <div className="border rounded-lg bg-white relative" style={{ height: '300px' }}>
            <SignaturePad
              ref={signaturePadRef}
              canvasProps={{
                className: 'w-full h-full',
                style: {
                  maxWidth: '100%',
                  maxHeight: '100%',
                  touchAction: 'none',
                  cursor: 'crosshair'
                }
              }}
              options={{
                minWidth: 1,
                maxWidth: 2,
                penColor: 'black',
                velocityFilterWeight: 0.7
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Signature
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimesheetSignDialog; 