import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import AllUsersClockingHistory from '../AllUsersClockingHistory';

const AllUsersTab = ({ handleLocationClick }) => {
  console.log('Rendering AllUsersTab');
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">All Users Activity</h2>
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>

        {['today', 'week', 'month', 'all'].map((period) => (
          <TabsContent key={period} value={period}>
            <ScrollArea className="h-[600px]">
              <AllUsersClockingHistory 
                onLocationClick={handleLocationClick}
                period={period}
              />
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AllUsersTab;