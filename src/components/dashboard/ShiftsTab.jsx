import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import UserShifts from '../UserShifts';

const ShiftsTab = ({ 
  userId, 
  userRole, 
  handleUnclockedUsers, 
  handleLongShifts, 
  handleLocationClick 
}) => {
  return (
    <Card>
      <CardContent className="pt-6 cursor-pointer hover:bg-gray-50 transition-colors">
        <h3 className="text-lg font-semibold mb-4">Shifts & History</h3>
        <UserShifts 
          userId={userId} 
          userRole={userRole} 
          onUnclockedUsers={handleUnclockedUsers}
          onLongShifts={handleLongShifts}
          showHistory={true}
          showLocation={true}
          onLocationClick={handleLocationClick}
        />
      </CardContent>
    </Card>
  );
};

export default ShiftsTab;