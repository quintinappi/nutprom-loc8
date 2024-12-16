import React, { useState } from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { Button } from "@/components/ui/button";
import TimesheetPDF from './TimesheetPDF';

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
        size="sm"
        onClick={() => setShowPreview(true)}
      >
        Preview PDF
      </Button>
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-[90%] h-[90%] p-4 rounded-lg flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">PDF Preview</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                Close
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <PDFViewer width="100%" height="100%" className="border rounded">
                <TimesheetPDF
                  employeeDetails={employeeDetails}
                  period={period}
                  entries={entries}
                  totals={totals}
                  companyLogo={companyLogo}
                />
              </PDFViewer>
            </div>
          </div>
        </div>
      )}

      {/* Download Button */}
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
        fileName={`timesheet-${period?.startDate}-${period?.endDate}.pdf`}
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
