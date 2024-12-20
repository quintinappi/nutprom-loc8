# NutPro Time Tracking System

## Overview

NutPro Time Tracking is a comprehensive employee time management system built with React and Firebase, featuring real-time updates, location tracking, and advanced leave management.

## Core Features

### Clock In/Out System
- Real-time clock in/out functionality
- Location tracking for each clock action
- Automatic status updates (On Duty/Not on Duty)
- Offline mode support with automatic sync
- Leave day booking system

### Shift Management
- View shifts by different time periods (Today/Week/Month/All Time)
- Real-time shift duration calculations
- Location history for each shift
- Shift type tracking (Regular/Leave Day)
- Shift deletion capability (Admin only)

### Data Export
- CSV export functionality
- Customizable date ranges
- Includes shift types, durations, and locations
- Automatic handling of missing days
- Comment support for manual annotations

## Technical Implementation

### Authentication & Authorization
- Firebase Authentication for user management
- Role-based access control (Admin/Regular User)
- Secure data access patterns

### Data Storage (Firebase)
- Clock entries structure:
  ```javascript
  {
    user_id: string,
    action: 'in' | 'out',
    timestamp: ISO string,
    location: string,
    latitude: number | null,
    longitude: number | null,
    isLeaveDay: boolean
  }
  ```

### Real-time Updates
- Live status updates using Firestore snapshots
- Automatic UI updates on data changes
- Efficient query patterns for real-time data

### Location Handling
- Geolocation API integration
- Reverse geocoding for human-readable locations
- Fallback handling for unavailable location services

### Offline Support
- Local storage for offline clock actions
- Automatic synchronization when online
- Conflict resolution strategies

## Recent Updates (December 9, 2024)

### Leave Day Management Improvements
1. Enhanced Leave Day Status
   - Real-time leave day status tracking
   - Clear UI indication when leave is booked
   - Automatic status updates on leave day changes

2. Leave Day Validation
   - Prevention of double-booking leave days
   - Blocking clock actions on leave days
   - Admin-only leave day deletion

3. Error Handling
   - Clear error messages for leave day conflicts
   - Improved feedback for unauthorized actions
   - Real-time status synchronization after admin actions

### Technical Improvements
1. Real-time Listeners
   - Implemented real-time leave day status tracking
   - Improved state management for leave days
   - Enhanced deletion handling

2. Status Management
   - Unified status display across components
   - Improved status accuracy after admin actions
   - Better handling of edge cases

3. UI/UX Enhancements
   - Clearer status indicators
   - Disabled actions during leave days
   - Improved error messaging

## Usage Guidelines

### For Users
1. Clock In/Out
   - Use the main buttons to clock in/out
   - Ensure location services are enabled
   - Check current status before actions

2. Leave Management
   - Book leave using the "Book Leave" button
   - Cannot clock in/out on leave days
   - Contact admin to cancel leave bookings

3. Viewing History
   - Use period tabs to view different timeframes
   - Check shift details in the history view
   - Export data as needed

### For Administrators
1. User Management
   - View all users' clock history
   - Delete incorrect entries as needed
   - Manage leave day bookings

2. Data Management
   - Export user data via CSV
   - Review and manage shift entries
   - Handle leave day cancellations

## Maintenance Notes

- Regular database cleanup recommended
- Monitor storage usage for location data
- Check for offline data synchronization issues
- Review error logs for system health

## Version History

### Version 6.0 (December 9, 2024)
- Implemented comprehensive leave day management
- Added real-time leave status tracking
- Improved error handling and user feedback
- Enhanced admin controls for leave management

### Version 5.0
- Added "Last Shift Hours" display
- Various bug fixes and improvements

### Version 3.0
- Initial stable release
- Basic clock in/out functionality
- Location tracking implementation

### feature/timesheet-pdf-signatures
- Added signature functionality for timesheets
- Implemented PDF preview with signature display
- Added tablet view for timesheet signing
- Added supervisor approval workflow
- Fixed employee name display in PDFs
- Improved PDF preview functionality
- Added company logo support in PDFs

### feature/timesheet-pdf-totals
- Added total hours calculation
- Implemented PDF export with totals
- Added timesheet finalization workflow

### feature/timesheet-hours-modification
- Added ability to modify timesheet hours
- Implemented timesheet entry editing
- Added validation for time entries

### feature/pdf-export
- Initial PDF export implementation
- Basic timesheet layout
- Company logo integration

### 3rd
- Initial timesheet management implementation
- Basic CRUD operations
- User authentication
- Role-based access control

## Setup
1. Clone the repository
2. Install dependencies with `npm install`
3. Configure Firebase credentials
4. Run development server with `npm run dev`

## Features
- Employee timesheet management
- PDF export with signatures
- Tablet-friendly interface for signing
- Supervisor approval workflow
- Role-based access control
- Company logo integration
- Total hours calculation
- Timesheet finalization
