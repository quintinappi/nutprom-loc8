# Timesheet Signatures Implementation Plan

## Database Schema

### New Collections

#### `timesheets_for_signature`
```javascript
{
  id: string,
  employee_id: string,
  supervisor_id: string,
  period: {
    startDate: timestamp,
    endDate: timestamp
  },
  status: 'pending_supervisor' | 'pending_employee' | 'signed' | 'rejected',
  created_at: timestamp,
  supervisor_signature: string | null,
  employee_signature: string | null,
  timesheet_data: {
    entries: Array<TimesheetEntry>,
    totals: {
      regular_hours: number,
      overtime_hours: number
    }
  }
}
```

#### Updates to `user_settings`
```javascript
{
  // Existing fields...
  supervisor_signature: string | null,
  signature_updated_at: timestamp
}
```

## Timesheet Storage System

### Firestore Schema

```javascript
// timesheets/{timesheetId}
{
  id: string,            // Format: `${employeeId}_${periodStart}_${periodEnd}`
  employeeId: string,    // Reference to user
  period: {
    start: timestamp,
    end: timestamp
  },
  entries: array,        // Timesheet entries
  totals: {
    regular: number,
    overtime: number
  },
  status: string,        // One of: draft, pending_employee, pending_supervisor, completed, rejected
  createdAt: timestamp,
  updatedAt: timestamp,
  employeeSignature: string,    // Base64 signature image
  supervisorSignature: string,  // Base64 signature image
  employeeSignedAt: timestamp,
  supervisorSignedAt: timestamp,
  rejectionReason: string
}
```

### Status Flow
1. DRAFT → Initial state when timesheet is created
2. PENDING_EMPLOYEE → Ready for employee signature
3. PENDING_SUPERVISOR → Employee signed, waiting for supervisor
4. COMPLETED → Both signatures obtained
5. REJECTED → Rejected by supervisor (includes reason)

### Security Rules
- Employees can:
  - Read their own timesheets
  - Create new timesheets
  - Update status to PENDING_SUPERVISOR (when signing)
  
- Supervisors can:
  - Read all timesheets
  - Update status to COMPLETED/REJECTED
  - Add their signature
  
- Admins have full access

### TimesheetStorage Service
The `TimesheetStorage` service provides methods for:
- Storing and updating timesheets
- Managing signatures
- Querying timesheets by status
- Handling status transitions

```javascript
// Example usage
import { timesheetStorage, TimesheetStatus } from '@/services/TimesheetStorage';

// Store new timesheet
const timesheetId = await timesheetStorage.storeTimesheet({
  employeeId,
  period,
  entries,
  totals
});

// Add employee signature
await timesheetStorage.storeEmployeeSignature(timesheetId, signatureData);

// Get pending signatures
const pendingTimesheets = await timesheetStorage.getPendingEmployeeSignatures(employeeId);
```

## Implementation Progress

### Completed
1. ✅ Supervisor Signature Component
   - Signature pad implementation
   - Save/load from Firestore
   - Clear functionality
   - Change signature option

2. ✅ PDF Generation with Signatures
   - Supervisor signature display
   - Signature size optimization (100px height)
   - Employee signature placeholder
   - Date display

3. ✅ Employee Signature Component
   - Signature pad implementation
   - Save/load from Firestore
   - Clear functionality
   - Change signature option
   - Visual placeholder in PDF when signature missing

### In Progress ⏳
- Phase 2: Signature Request System
- Phase 3: Clocking Tablet Integration
- Phase 4: Management Interface

### Next Steps
1. 🔄 Validation & Status
   - Add validation to prevent timesheet submission without required signatures
   - Show status indicators for missing signatures
   - Add warnings/notifications when signatures are missing

2. 📱 Mobile Responsiveness
   - Ensure signature pads work well on mobile devices
   - Optimize the UI for touch screens

3. 📝 Audit Trail
   - Track signature history
   - Log when signatures are added or cleared

4. ⏰ Signature Timestamps
   - Add timestamps for when each signature was made
   - Display these timestamps in the PDF

## Component Structure

```
/components
  /timesheet
    /signatures
      SupervisorSignaturePad.jsx    # For initial supervisor signature setup
      TimesheetSignatureDialog.jsx   # For requesting signatures
      StoredTimesheetsView.jsx      # For viewing/managing signed/unsigned sheets
      EmployeeSignaturePad.jsx      # For employee signature collection
  /clocking
    /signatures
      EmployeeSignatureRequest.jsx   # Signature interface on clocking tablet
```

## Component Usage

### EmployeeSignaturePad
```jsx
<EmployeeSignaturePad userId={currentUser.uid} />
```

The EmployeeSignaturePad component provides:
- Signature drawing interface
- Save/load functionality with Firestore
- Clear and change signature options
- Responsive design
- Visual feedback for saved signatures

### SupervisorSignaturePad
```jsx
<SupervisorSignaturePad userId={supervisorId} />
```

The SupervisorSignaturePad component provides:
- Signature drawing interface
- Save/load functionality with Firestore
- Clear and change signature options
- Responsive design
- Visual feedback for saved signatures

### TimesheetPDF
```jsx
<TimesheetPDF 
  employeeDetails={details}
  period={period}
  entries={entries}
  totals={totals}
  supervisorSignature={supervisorSignature}
  employeeSignature={employeeSignature}
/>
```

The TimesheetPDF component now includes:
- Employee signature display/placeholder
- Supervisor signature display
- Optimized signature sizes
- Current date display

## State Management

### Redux/Context States
```javascript
{
  signatures: {
    pendingRequests: [],
    signedTimesheets: [],
    currentSignatureRequest: null
  },
  notifications: {
    signatureRequests: [],
    completedSignatures: []
  }
}
```

## Security Considerations

- [x] Update Firebase security rules for new collections
- [ ] Implement signature validation
- [ ] Add audit trail
- [ ] Set up signature request expiration
- [ ] Implement employee code validation

## Technical Requirements

### Dependencies
```json
{
  "react-signature-canvas": "^1.0.6",
  "@react-pdf/renderer": "^3.1.12",
  "firebase": "^10.x",
  "date-fns": "^2.x"
}
```

## Progress Tracking

### Completed ✅
- Initial planning and documentation
- Supervisor Signature Component
- PDF Generation with Signatures
- Employee Signature Component

### In Progress ⏳
- Phase 2: Signature Request System
- Phase 3: Clocking Tablet Integration
- Phase 4: Management Interface

### Pending 🔄
- Validation & Status
- Mobile Responsiveness
- Audit Trail
- Signature Timestamps

## Notes

- Signatures should be stored as base64 PNG data
- Consider implementing signature expiration for security
- Need to handle offline scenarios in clocking tablet
- Consider adding signature verification step
- Plan for bulk signature requests for multiple timesheets

---
Last Updated: 2024-12-16
