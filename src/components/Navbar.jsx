import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Clock, Users, Menu, X, Settings as SettingsIcon, BarChart, FileDown, ClipboardList } from 'lucide-react';
import { useMediaQuery } from '@react-hook/media-query';
import Logo from './Logo';
import { Link } from 'react-router-dom';

const Navbar = ({ onLogout, activeTab, setActiveTab, userRole }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const NavItem = ({ onClick, isActive, icon, children, to }) => (
    <Link to={to}>
      <Button
        onClick={onClick}
        variant={isActive ? 'default' : 'ghost'}
        className="flex items-center w-full justify-start"
      >
        {icon}
        <span className="ml-2">{children}</span>
      </Button>
    </Link>
  );

  const navItems = [
    { id: 'clock', label: 'Clock In/Out', icon: <Clock className="h-4 w-4" />, show: true, to: '/' },
    { id: 'total-hours', label: 'Total Hours', icon: <BarChart className="h-4 w-4" />, show: true, to: '/total-hours' },
    { id: 'users', label: 'Manage Users', icon: <Users className="h-4 w-4" />, show: userRole === 'admin', to: '/users' },
    { id: 'timesheet', label: 'Timesheets', icon: <ClipboardList className="h-4 w-4" />, show: userRole === 'admin', to: '/timesheet' },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="h-4 w-4" />, show: true, to: '/settings' },
    { id: 'export-csv', label: 'Export CSV', icon: <FileDown className="h-4 w-4" />, show: userRole === 'admin', to: '/export-csv' },
  ];

  const handleSetActiveTab = (tabId) => {
    if (setActiveTab && typeof setActiveTab === 'function') {
      setActiveTab(tabId);
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Logo size="small" />
            <span className="font-bold text-xl ml-2">NutProM</span>
          </div>
          {isMobile ? (
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              {navItems.filter(item => item.show).map(item => (
                <NavItem
                  key={item.id}
                  onClick={() => handleSetActiveTab(item.id)}
                  isActive={activeTab === item.id}
                  icon={item.icon}
                  to={item.to}
                >
                  {item.label}
                </NavItem>
              ))}
              <Button onClick={async () => {
                try {
                  console.log('Attempting to logout...');
                  await onLogout();
                  console.log('Logout successful');
                } catch (error) {
                  console.error('Logout failed:', error);
                }
              }} variant="outline">
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
      {isMobile && isMenuOpen && (
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navItems.filter(item => item.show).map(item => (
            <NavItem
              key={item.id}
              onClick={() => {
                handleSetActiveTab(item.id);
                setIsMenuOpen(false);
              }}
              isActive={activeTab === item.id}
              icon={item.icon}
              to={item.to}
            >
              {item.label}
            </NavItem>
          ))}
          <Button onClick={async () => {
            try {
              console.log('Attempting to logout...');
              await onLogout();
              console.log('Logout successful');
            } catch (error) {
              console.error('Logout failed:', error);
            }
          }} variant="outline" className="w-full justify-start">
            Logout
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;