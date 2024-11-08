import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const TotalsGraph = ({ thisMonth, yesterday, today, userName }) => {
  const formatHours = (hours) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const data = [
    { name: 'This Month', hours: thisMonth },
    { name: 'Yesterday', hours: yesterday },
    { name: 'Today', hours: today },
  ];

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">
          {userName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mt-4">
          <p>This Month: {formatHours(thisMonth)}</p>
          <p>Yesterday: {formatHours(yesterday)}</p>
          <p>Today: {formatHours(today)}</p>
        </div>
        <Accordion type="single" collapsible className="w-full mt-4">
          <AccordionItem value="totals-graph">
            <AccordionTrigger className="text-base font-normal">View totals graph</AccordionTrigger>
            <AccordionContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatHours(value)} />
                  <Legend />
                  <Bar dataKey="hours" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default TotalsGraph;
