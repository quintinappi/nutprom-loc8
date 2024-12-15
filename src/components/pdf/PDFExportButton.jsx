import React, { useState } from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { Button } from "@/components/ui/button";
import TimesheetPDF from './TimesheetPDF';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PDFExportButton = ({ 
  employeeDetails, 
  period, 
  entries, 
  totals,
  companyLogo 
}) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="flex gap-2">
      {/* Preview Button and Dialog */}
      <Button 
        variant="outline"
        onClick={() => setShowPreview(true)}
      >
        Preview PDF
      </Button>
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-4">
          <DialogHeader className="pb-2">
            <DialogTitle>PDF Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-[calc(95vh-4rem)]">
            <PDFViewer 
              width="100%" 
              height="100%" 
              style={{ 
                border: 'none',
                width: '100%',
                height: '100%',
                display: 'block'
              }}
            >
              <TimesheetPDF
                employeeDetails={employeeDetails}
                period={period}
                entries={entries}
                totals={totals}
                companyLogo={companyLogo}
              />
            </PDFViewer>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Button */}
      <PDFDownloadLink
        document={
          <TimesheetPDF
            employeeDetails={employeeDetails}
            period={period}
            entries={entries}
            totals={totals}
            companyLogo={companyLogo}
          />
        }
        fileName={`timesheet-${employeeDetails.name}-${period.startDate}.pdf`}
      >
        {({ blob, url, loading, error }) => (
          <Button 
            disabled={loading} 
            variant="outline"
          >
            {loading ? 'Generating PDF...' : 'Export PDF'}
          </Button>
        )}
      </PDFDownloadLink>
    </div>
  );
};

export default PDFExportButton;
