import React from 'react';
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import { FirebaseAuthProvider } from "./firebase/auth";
import Settings from './components/Settings';
import { useState, useEffect } from 'react';
import { ThemeContext } from './theme/ThemeContext';
import RequireAuth from './components/RequireAuth';
import AuthForm from './components/AuthForm';
import Index from './pages/Index';
import ManageUsers from './pages/ManageUsers';
import LoadingScreen from './components/LoadingScreen';
import TabletClock from './pages/TabletClock';
import TimesheetPage from './pages/TimesheetPage';
import StoredTimesheets from './pages/StoredTimesheets';

const queryClient = new QueryClient();

const App = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Add loading state handling
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Show loading screen for at least 1.5 seconds

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes visible, check if we need to reload
        if (!isOnline) {
          window.location.reload();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(timer);
    };
  }, [isOnline]);

  // Add error boundary
  useEffect(() => {
    const handleError = (event) => {
      console.error('Error caught:', event.error);
      // If there's a critical error, reload the page
      if (event.error?.message?.includes('Firebase') || event.error?.message?.includes('auth')) {
        window.location.reload();
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <div className={`App ${theme}`}>
          <BrowserRouter>
            <FirebaseAuthProvider>
              <TooltipProvider>
                <Toaster />
                {!isOnline && (
                  <div className="bg-yellow-500 text-white p-2 text-center">
                    You are currently offline. Some features may be limited.
                  </div>
                )}
                <Routes>
                  <Route path="/login" element={<AuthForm />} />
                  <Route path="/tablet-clock" element={<TabletClock />} />
                  <Route
                    path="/"
                    element={
                      <RequireAuth>
                        <Index />
                      </RequireAuth>
                    }
                  />
                  {navItems.map(({ to, page, isAdmin }) => (
                    <Route
                      key={to}
                      path={to}
                      element={
                        <RequireAuth adminRequired={isAdmin}>
                          {page}
                        </RequireAuth>
                      }
                    />
                  ))}
                  <Route
                    path="/users"
                    element={
                      <RequireAuth adminRequired={true}>
                        <ManageUsers />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/timesheet"
                    element={
                      <RequireAuth adminRequired={true}>
                        <TimesheetPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/stored-timesheets"
                    element={
                      <RequireAuth adminRequired={true}>
                        <StoredTimesheets />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <RequireAuth>
                        <Settings />
                      </RequireAuth>
                    }
                  />
                </Routes>
              </TooltipProvider>
            </FirebaseAuthProvider>
          </BrowserRouter>
        </div>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
};

export default App;