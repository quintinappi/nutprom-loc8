import React, { useState, useEffect } from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { Button } from "@/components/ui/button";
import TimesheetPDF from './TimesheetPDF';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useFirebaseAuth } from '../../firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const PDFExportButton = ({ 
  employeeDetails, 
  period, 
  entries, 
  totals,
  companyLogo,
  employeeSignature,
  showPreview: initialShowPreview = false
}) => {
  const [showPreview, setShowPreview] = useState(initialShowPreview);
  const [supervisorSignature, setSupervisorSignature] = useState(null);
  const { user } = useFirebaseAuth();

  useEffect(() => {
    setShowPreview(initialShowPreview);
  }, [initialShowPreview]);

  useEffect(() => {
    const fetchSignature = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        setSupervisorSignature(userData?.supervisor_signature || null);
      }
    };
    fetchSignature();
  }, [user]);

  if (initialShowPreview) {
    return (
      <div className="w-full h-full flex flex-col">
        <PDFViewer width="100%" height="100%" className="border rounded-lg">
          <TimesheetPDF
            employeeDetails={employeeDetails}
            period={period}
            entries={entries}
            totals={totals}
            companyLogo={companyLogo}
            supervisorSignature={supervisorSignature}
            employeeSignature={employeeSignature}
          />
        </PDFViewer>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {/* Preview Button and Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Preview PDF
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-6">
          <DialogHeader>
            <DialogTitle>Timesheet Preview</DialogTitle>
          </DialogHeader>
          <div className="w-full h-[80vh]">
            <PDFViewer width="100%" height="100%" className="border rounded-lg">
              <TimesheetPDF
                employeeDetails={employeeDetails}
                period={period}
                entries={entries}
                totals={totals}
                companyLogo={companyLogo}
                supervisorSignature={supervisorSignature}
                employeeSignature={employeeSignature}
              />
            </PDFViewer>
          </div>
        </DialogContent>
      </Dialog>

      {/* Download Button */}
      <PDFDownloadLink
        document={
          <TimesheetPDF
            employeeDetails={employeeDetails}
            period={period}
            entries={entries}
            totals={totals}
            companyLogo={companyLogo}
            supervisorSignature={supervisorSignature}
            employeeSignature={employeeSignature}
          />
        }
        fileName={`timesheet-${period?.start}-${period?.end}.pdf`}
      >
        {({ loading }) => (
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Download PDF'}
          </Button>
        )}
      </PDFDownloadLink>
    </div>
  );
};

export default PDFExportButton;
