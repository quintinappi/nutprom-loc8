import { HomeIcon, ClockIcon, UsersIcon, SettingsIcon, BarChartIcon, FileDownIcon } from "lucide-react";
import Index from "./pages/Index.jsx";
import TotalHoursPage from "./components/TotalHoursPage.jsx";
import CodeClocking from "./components/CodeClocking.jsx";
import ExportCSVPage from "./pages/ExportCSVPage.jsx";
import UserManagement from "./components/UserManagement.jsx";
import Settings from "./components/Settings.jsx";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
    isAdmin: false,
  },
  {
    title: "Total Hours",
    to: "/total-hours",
    icon: <BarChartIcon className="h-4 w-4" />,
    page: <TotalHoursPage />,
    isAdmin: false,
  },
  {
    title: "Users",
    to: "/users",
    icon: <UsersIcon className="h-4 w-4" />,
    page: <UserManagement />,
    isAdmin: true,
  },
  {
    title: "Settings",
    to: "/settings",
    icon: <SettingsIcon className="h-4 w-4" />,
    page: <Settings />,
    isAdmin: false,
  },
  {
    title: "Code Clocking",
    to: "/code-clocking",
    icon: <ClockIcon className="h-4 w-4" />,
    page: <CodeClocking />,
    isAdmin: false,
  },
  {
    title: "Export CSV",
    to: "/export-csv",
    icon: <FileDownIcon className="h-4 w-4" />,
    page: <ExportCSVPage />,
    isAdmin: true,
  },
];