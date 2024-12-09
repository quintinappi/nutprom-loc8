import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AllUsersClockingHistory from '../AllUsersClockingHistory';

const AllUsersTab = ({ handleLocationClick }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">All Users Activity</h2>
      </div>
      
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>

        {['today', 'week', 'month', 'all'].map((period) => (
          <TabsContent key={period} value={period}>
            <AllUsersClockingHistory 
              onLocationClick={handleLocationClick}
              period={period}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AllUsersTab;