const fs = require('fs');
let c = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

c = c.replace(/\/\/ Date Range State \(Default to current month\)/g, '/* Date Range State */');
c = c.replace(/\/\/ Monday start/g, '/* Monday start */');
c = c.replace(/\/\/ Don't change dates, let user pick/g, '/* Don change */');
c = c.replace(/\/\/ Initial load/g, '/* Initial load */');
c = c.replace(/\/\/ Date Filter/g, '/* Date Filter */');
c = c.replace(/\/\/ Summary Cards/g, '/* Summary Cards */');
c = c.replace(/\/\/ Tabs/g, '/* Tabs */');
c = c.replace(/\/\/ Simple Repairs List View reused or custom table/g, '/* Simple Repairs List */');
c = c.replace(/\/\/ We could create a dedicated component, but for now reuse DailyTable logic or simple mapping/g, '/* We could create a dedicated */');
c = c.replace(/\/\/ item\.price is unit price at sale\? Schema says SalesItem price is Float\. Usually unit price\./g, '/* Item price check */');
c = c.replace(/\/\/ Let's assume item\.price is unit price\./g, '/* Let assume */');
c = c.replace(/\/\/ profit = price - cost/g, '/* profit = price - cost */');
c = c.replace(/\/\/ LOANS TAB/g, '/* LOANS TAB */');

fs.writeFileSync('src/app/reports/page.tsx', c);
console.log('Replaced comments');
