const fs = require('fs');
let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

// The file got flattened to a single line, causing inline comments to comment out active code.
code = code.replace(/\/\/ Monday start\s+end =/g, '// Monday start\nend =');
code = code.replace(/\/\/ Don't change dates, let user pick\s+\}/g, '// Don\'t change dates, let user pick\n}');
code = code.replace(/\/\/ Initial load\s+return \(/g, '// Initial load\nreturn (');
code = code.replace(/\/\/ profit = price - cost\s+return \(/g, '// profit = price - cost\nreturn (');
code = code.replace(/Usually unit price\.\s+\/\//g, 'Usually unit price.\n//');
code = code.replace(/unit price\.\s+\/\//g, 'unit price.\n//');

fs.writeFileSync('src/app/reports/page.tsx', code);
console.log('Fixed file.');
