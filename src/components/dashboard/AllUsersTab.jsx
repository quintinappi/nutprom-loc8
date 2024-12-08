import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import AllUsersClockingHistory from '../AllUsersClockingHistory';

const AllUsersTab = ({ handleLocationClick }) => {
  console.log('Rendering AllUsersTab');
  return (
    <Card>
      <CardContent className="pt-6 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => {
        console.log('AllUsersTab card clicked');
      }}>
        <h3 className="text-lg font-semibold mb-4">All Users Activity</h3>
        <AllUsersClockingHistory onLocationClick={handleLocationClick} />
      </CardContent>
    </Card>
  );
};

export default AllUsersTab;