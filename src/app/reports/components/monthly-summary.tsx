'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface MonthlySummaryProps {
  data: any;
}

export function MonthlySummary({ data }: MonthlySummaryProps) {
  if (!data || !data.daily) return <div>No data available</div>;

  // Identify all unique technicians across the period to build dynamic columns
  const allTechNames = new Set<string>();
  data.daily.forEach((day: any) => {
    Object.values(day.technicians).forEach((tech: any) => {
       allTechNames.add(tech.name);
    });
  });
  const techs = Array.from(allTechNames).sort();

  return (
    <Card>
        <CardHeader>
        <CardTitle>Monthly Report (RAPOLO - Daily Target 12,500 RWF)</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
           <thead>
             <tr className="bg-muted border-b">
               <th className="p-2 text-left border-r min-w-[100px] sticky left-0 bg-muted">Date</th>
               {/* Technician Columns */}
               {techs.map(tech => (
                 <th key={tech} className="p-2 text-center border-r min-w-[160px] bg-blue-50/20" colSpan={2}>
                    <div className="font-bold text-blue-800">{tech}</div>
                    <div className="grid grid-cols-2 text-xs font-medium mt-1 border-t pt-1 border-blue-200">
                        <span className="text-green-700">Net Income</span>
                        <span className="text-red-600">Shortfall</span>
                    </div>
                 </th>
               ))}
               <th className="p-2 text-right border-r min-w-[100px]">Expenses</th>
               <th className="p-2 text-right border-r min-w-[100px]">Total Revenue</th>
               <th className="p-2 text-right min-w-[100px]">Business Balance</th>
             </tr>
           </thead>
           <tbody>
             {data.daily.map((day: any) => {
                // Business Balance = Total Revenue - Parts Cost - Expenses
                const dayBalance = day.income - day.partsCost - day.expenses;

                return (
                  <tr key={day.date} className="border-b hover:bg-muted/20">
                    <td className="p-2 border-r font-medium sticky left-0 bg-background">
                        {format(parseISO(day.date), 'dd-MMM')}
                    </td>
                    
                    {/* Tech Data Cells */}
                    {techs.map(techName => {
                        const techData = Object.values(day.technicians).find((t: any) => t.name === techName) as any;
                        // Income = Gross Profit (Revenue - Parts)
                        // Loss = Quota Shortfall (12500 - Income)
                        const income = techData?.grossProfit || 0;
                        const shortfall = techData?.quotaShortfall || 0;

                        return (
                            <>
                                <td className={`p-2 text-right border-r-0 ${income >= 12500 ? 'font-bold text-green-700' : 'text-green-600'}`}>
                                    {income !== 0 ? formatCurrency(income).replace('RWF', '') : '-'}
                                </td>
                                <td className={`p-2 text-right border-r text-red-500 bg-red-50/30 font-medium`}>
                                    {shortfall > 0 ? formatCurrency(shortfall).replace('RWF', '') : '-'}
                                </td>
                            </>
                        );
                    })}

                    <td className="p-2 text-right border-r text-red-600">
                        {day.expenses > 0 ? formatCurrency(day.expenses).replace('RWF', '') : '-'}
                    </td>
                    <td className="p-2 text-right border-r text-muted-foreground">
                        {day.income > 0 ? formatCurrency(day.income).replace('RWF', '') : '-'}
                    </td>
                    <td className={`p-2 text-right font-bold ${dayBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatCurrency(dayBalance).replace('RWF', '')}
                    </td>
                  </tr>
                );
             })}

             {/* Totals Row */}
             <tr className="bg-muted font-bold border-t-2 border-black">
                <td className="p-2 border-r sticky left-0 bg-muted">TOTAL</td>
                {techs.map(techName => {
                    const techSummary = data.summary.byTechnician[techName];
                    return (
                        <>
                            <td className="p-2 text-right text-green-800 border-t-2 border-green-800">
                                {techSummary ? formatCurrency(techSummary.grossProfit).replace('RWF', '') : '0'}
                            </td>
                            <td className="p-2 text-right border-r text-red-800 border-t-2 border-red-800 bg-red-100/50">
                                {techSummary ? formatCurrency(techSummary.quotaShortfall).replace('RWF', '') : '0'}
                            </td>
                        </>
                    );
                })}
                <td className="p-2 text-right border-r text-red-800">
                    {formatCurrency(data.summary.totalExpenses).replace('RWF', '')}
                </td>
                <td className="p-2 text-right border-r">
                    {formatCurrency(data.summary.totalRevenue).replace('RWF', '')}
                </td>
                <td className={`p-2 text-right ${data.summary.netProfit >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                    {formatCurrency(data.summary.netProfit).replace('RWF', '')}
                </td>
             </tr>
           </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
