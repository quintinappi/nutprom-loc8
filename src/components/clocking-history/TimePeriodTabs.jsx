import React from 'react';
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
  handleLocationClick,
  activeView
}) => {
  return (
    <ScrollArea className="h-[600px] w-full rounded-md border">
      <Accordion type="multiple" className="w-full">
        {Object.keys(shifts).length > 0 ? (
          sortUserEntries(shifts).map(([userId, userData]) => (
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
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            No shifts found for this period
          </div>
        )}
      </Accordion>
    </ScrollArea>
  );
};

export default TimePeriodTabs;