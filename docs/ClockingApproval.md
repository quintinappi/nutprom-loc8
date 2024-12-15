# Clocking Approval System Documentation

## Overview
The Clocking Approval System manages employee timesheet entries, including clock-in/out times, leave days, and hour modifications. This document outlines the core functionality and data flow of the system.

## Data Structure

### Timesheet Entry
```javascript
{
  userId: string,
  date: string,          // Format: "YYYY-MM-DD"
  clock_in_time: string, // Format: "HH:mm"
  clock_out_time: string,// Format: "HH:mm"
  time_in: string,       // ISO string
  time_out: string,      // ISO string
  duration: number,      // Hours in decimal
  modified_hours: number,// Modified duration if changed
  status: string,        // "pending" | "approved"
  comment: string,
  original_hours: string // Format: "Xh Ym"
}
```

### Clock Entry
```javascript
{
  user_id: string,
  date: string,         // Format: "YYYY-MM-DD"
  timestamp: string,    // ISO string
  status: string,       // "pending" | "approved"
  action: string,       // "in" | "out"
  modified_hours: number,
  comment: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

## Core Operations

### 1. Retrieving Timesheet Entries

Timesheet entries are fetched based on:
- User ID
- Date range (start and end dates)
- Status (optional)

```javascript
// Query structure
const query = query(
  collection(db, 'timesheet_entries'),
  where('userId', '==', userId),
  where('date', '>=', startDate),
  where('date', '<=', endDate)
);
```

### 2. Modifying Hours

#### A. Manual Hour Override
1. Select a timesheet entry
2. Enter new total hours
3. System will:
   - Update timesheet entry with new duration
   - Calculate new clock-out time based on clock-in time
   - Update or create corresponding clock entries
   - Maintain original clock-in time if exists

#### B. Clock Time Modification
1. Select a timesheet entry
2. Modify clock-in and/or clock-out times
3. System will:
   - Calculate new duration based on time difference
   - Update all time-related fields
   - Create/update corresponding clock entries

### 3. Approval Process

1. Select entries to approve
2. System will:
   - Update entry status to "approved"
   - Create/update corresponding clock entries
   - Update modified hours if different from original

### 4. Leave Day Management

Leave days are handled as special entries:
- Clock times are marked as "Leave Day"
- Duration is set to standard work day (8h)
- No clock entries are required

## Data Flow

1. **Entry Creation**
   ```
   User Action → TimesheetTable → TimesheetManager → Firestore
                                                  → timesheet_entries
                                                  → clock_entries
   ```

2. **Hour Modification**
   ```
   Edit Action → handleSaveEdit → handleModifiedHoursChange → Firestore
              → Update timesheet entry
              → Delete old clock entries
              → Create new clock entries
   ```

3. **Approval Flow**
   ```
   Approve Action → handleApprove → Update status
                                 → Sync clock entries
                                 → Update modified hours
   ```

## Error Handling

The system includes validation for:
- Missing user selection
- Invalid time formats
- Invalid hour inputs
- Missing required fields

Error messages are displayed using toast notifications.

## Best Practices

1. **Time Entry**
   - Always validate time formats (HH:mm)
   - Ensure clock-out time is after clock-in time
   - Preserve original times when modifying hours

2. **Hour Modifications**
   - Document reasons for modifications in comments
   - Verify total hours match clock times
   - Check for existing entries before creating new ones

3. **Approval Process**
   - Review modified hours before approval
   - Ensure all required fields are filled
   - Verify clock entries match timesheet entries

## Common Operations Examples

### Modifying Total Hours
```javascript
const updates = {
  userId: selectedUser.id,
  date: entry.date,
  modified_hours: newHours,
  duration: newHours,
  comment: "Manual hours override",
  // Clock times are automatically calculated
};
```

### Updating Clock Times
```javascript
const updates = {
  clock_in_time: newTimeIn,
  clock_out_time: newTimeOut,
  time_in: clockInTime.toISOString(),
  time_out: clockOutTime.toISOString(),
  duration: calculatedDuration,
  modified_hours: calculatedDuration
};
```

### Approving Entries
```javascript
const updates = {
  status: "approved",
  modified_hours: entry.modified_hours || entry.duration,
  // Clock entries are automatically synchronized
};
```

## Troubleshooting

### Common Issues

1. **Hours Not Updating**
   - Verify userId is correctly set
   - Check if clock entries were created
   - Verify all time fields are properly formatted

2. **Clock Times Mismatch**
   - Ensure both clock-in and clock-out times are set
   - Verify time format (HH:mm)
   - Check duration calculation

3. **Approval Failed**
   - Verify user permissions
   - Check for missing required fields
   - Ensure clock entries exist

### Debug Tips

1. Check console logs for:
   - Entry updates
   - Clock entry creation
   - Error messages

2. Verify Firestore documents:
   - timesheet_entries collection
   - clock_entries collection
   - Document fields and formats

## Security Considerations

1. **Data Validation**
   - Validate all user inputs
   - Check permissions before updates
   - Sanitize time and date inputs

2. **Error Handling**
   - Provide clear error messages
   - Log errors for debugging
   - Handle edge cases gracefully

3. **Data Consistency**
   - Maintain sync between collections
   - Verify data integrity after updates
   - Handle concurrent modifications
