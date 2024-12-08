import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion } from "@/components/ui/accordion";
import UserHistoryItem from './UserHistoryItem';

const TimePeriodTabs = ({ 
  shifts, 
  sortUserEntries, 
  getUserName, 
  getUserStatus, 
  formatDuration, 
  formatLocation, 
  handleLocationClick 
}) => {
  const [activeView, setActiveView] = React.useState('today');

  return (
    <Tabs defaultValue="today" className="w-full" onValueChange={setActiveView}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="today">Today</TabsTrigger>
        <TabsTrigger value="week">This Week</TabsTrigger>
        <TabsTrigger value="month">This Month</TabsTrigger>
        <TabsTrigger value="all">All Time</TabsTrigger>
      </TabsList>

      {['today', 'week', 'month', 'all'].map((period) => (
        <TabsContent key={period} value={period}>
          <ScrollArea className="h-[600px] w-full rounded-md border">
            <Accordion type="multiple" className="w-full">
              {sortUserEntries(shifts).map(([userId, userData]) => (
                <UserHistoryItem
                  key={userId}
                  userId={userId}
                  userData={userData}
                  getUserName={getUserName}
                  getUserStatus={getUserStatus}
                  formatDuration={formatDuration}
                  formatLocation={formatLocation}
                  handleLocationClick={handleLocationClick}
                />
              ))}
            </Accordion>
            {Object.keys(shifts).length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No shifts found for this period
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default TimePeriodTabs;