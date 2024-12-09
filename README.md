# Welcome to your GPT Engineer project

## Project info

**Project**: clockify-journey

**URL**: https://run.gptengineer.app/projects/d69493ab-b227-48e9-b01e-24779f411153/improve

**Version**: 5.0

## How can I edit this code?

There are several ways of editing your application.

**Use GPT Engineer**

Simply visit the GPT Engineer project at [GPT Engineer](https://gptengineer.app/projects/d69493ab-b227-48e9-b01e-24779f411153/improve) and start prompting.

Changes made via gptengineer.app will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in the GPT Engineer UI.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
git clone https://github.com/GPT-Engineer-App/clockify-journey.git
cd clockify-journey
npm i

# This will run a dev server with auto reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- React
- shadcn-ui
- Tailwind CSS
- Firebase

## How can I deploy this project?

All GPT Engineer projects can be deployed directly via the GPT Engineer app.

Simply visit your project at [GPT Engineer](https://gptengineer.app/projects/d69493ab-b227-48e9-b01e-24779f411153/improve) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify or GitHub pages. Visit our docs for more details: [Custom domains](https://docs.gptengineer.app/tips-tricks/custom-domain/)

## Time Tracking System

The NutPro time tracking system provides comprehensive clock-in/out functionality with the following features:

### Shift Processing & Display
- **Time Periods**: Users can view shifts across different time periods:
  - Today: Shows shifts from 00:00 of the current day
  - This Week: Shows shifts from the past 7 days
  - This Month: Shows shifts from the past 30 days
  - All Time: Shows complete shift history

- **Status Determination**:
  - User status (On Duty/Not on Duty) is determined by their most recent clock action
  - Status is calculated by sorting all clock entries by timestamp and checking the latest action
  - A user is considered "On Duty" if their most recent action is "clock in"
  - The status is reflected in both personal and all-users views

- **Duration Calculation**:
  - Shift duration is calculated as the time difference between clock-in and clock-out
  - For active shifts (no clock-out), duration is calculated up to the current time
  - Duration is displayed in hours and minutes format (e.g., "2h 30m")
  - Durations are automatically updated for active shifts

- **Location Tracking**:
  - Each clock action records the user's location
  - Locations are displayed in a simplified format (ward/area name)
  - Full location details are available on click
  - Location history is maintained for both clock-in and clock-out actions

### Implementation Details
- Timestamps are stored in ISO format for consistency across timezones
- Real-time updates using Firebase Firestore snapshots
- Consistent shift processing logic across personal and all-users views
- Efficient filtering using Firestore queries for different time periods

## Changelog

### Version 5.0
- Second deployment to client
- Added "Last Shift Hours" display under total hours in UserShifts component
- Various bug fixes and performance improvements

### Version 3.0
- Fixed duplicate entries issue in Clock History
- Improved overall stability and performance
- Deployed to the client
