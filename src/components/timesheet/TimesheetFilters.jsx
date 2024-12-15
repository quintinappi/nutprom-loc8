import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";

const TimesheetFilters = ({ 
  selectedDateRange, 
  selectedUser,
  users,
  onFilter,
  isAdmin
}) => {
  const handleDateSelect = (dates) => {
    if (!dates) {
      onFilter({
        user: users.find(u => u.id === selectedUser),
        dateRange: { start: null, end: null }
      });
      return;
    }

    const newDateRange = {
      start: dates.from,
      end: dates.to
    };
    
    onFilter({
      user: users.find(u => u.id === selectedUser),
      dateRange: newDateRange
    });
  };

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
      <div className="flex-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDateRange?.start && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDateRange?.start ? (
                selectedDateRange?.end ? (
                  <>
                    {format(selectedDateRange.start, "LLL dd, y")} -{" "}
                    {format(selectedDateRange.end, "LLL dd, y")}
                  </>
                ) : (
                  format(selectedDateRange.start, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="range"
              selected={{
                from: selectedDateRange?.start || undefined,
                to: selectedDateRange?.end || undefined
              }}
              defaultMonth={selectedDateRange?.start}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-1">
        <Select 
          value={selectedUser?.id || ''} 
          onValueChange={(userId) => {
            const selectedUserObj = users.find(u => u.id === userId);
            onFilter({ 
              user: selectedUserObj, 
              dateRange: selectedDateRange 
            });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select User" />
          </SelectTrigger>
          <SelectContent>
            {users?.map((user) => (
              <SelectItem 
                key={user.id} 
                value={user.id}
              >
                {user.name && user.surname ? 
                  `${user.name} ${user.surname}` : 
                  user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TimesheetFilters;
