import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import Logo from '../Logo';
import { Alert, AlertDescription } from "@/components/ui/alert";

const ProfileSection = ({ name, surname, profilePic, clockStatus, isLongShift }) => {
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center mb-6">
          <Logo size="large" />
          <div className={`mt-4 flex flex-col items-center ${isLongShift ? 'bg-red-100 p-4 rounded' : ''}`}>
            <Avatar className="w-24 h-24 mb-2">
              <AvatarImage src={profilePic} alt={`${name} ${surname}`} className="object-cover" />
              <AvatarFallback>{name.charAt(0)}{surname.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">{name} {surname}</h2>
            <p className="text-sm text-gray-600 mt-1">Status: {clockStatus}</p>
            {isLongShift && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>
                  Warning: Current shift exceeds 12 hours!
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSection;