import React from 'react';
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import { FirebaseAuthProvider } from "./firebase/auth";
import UserManagement from './components/UserManagement';
import Settings from './components/Settings';
import { useState } from 'react'
import { ThemeContext } from './theme/ThemeContext'

const queryClient = new QueryClient();

const App = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [theme, setTheme] = useState('light')

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <div className={`App ${theme}`}>
          <FirebaseAuthProvider>
            <TooltipProvider>
              <Toaster />
              {!isOnline && (
                <div className="bg-yellow-500 text-white p-2 text-center">
                  You are currently offline. Some features may be limited.
                </div>
              )}
              <BrowserRouter>
                <Routes>
                  {navItems.map(({ to, page }) => (
                    <Route key={to} path={to} element={page} />
                  ))}
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </FirebaseAuthProvider>
        </div>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
};

export default App;