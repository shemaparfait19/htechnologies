const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Simple single line string replacements
    content = content.replace(/KING SERVICE TECH LTD/g, 'H TECHNOLOGIES LTD');
    content = content.replace(/KING SERVICE TECH/g, 'H TECHNOLOGIES LTD');
    content = content.replace(/King Service Tech/g, 'H TECHNOLOGIES LTD');
    content = content.replace(/KingTech/g, 'HTech');
    content = content.replace(/KingServ/g, 'HTech');

    // Complex strings
    content = content.replace(/Maintenance, Installation & Repair Services \(Electronics, HVAC, IT, etc\.\)/g, 'TIN: 123071609 | Momo pay.: 1700122 | Nyamata/Bugesera');
    content = content.replace(/Phone: 0787 649 480 \/ 0798 701 852/g, 'Tel: 0780562454 / 0789379218 / 0796660661');
    content = content.replace(/Email: kstrwanda@gmail\.com  \|  Website: www\.kingservicetechltd\.com/g, 'Email: htechnologiesltd1@gmail.com');
    content = content.replace(/Phone & Computer Repair Services/g, 'TIN: 123071609 | Momo pay.: 1700122');
    content = content.replace(/Phone: \+250 787 649 480 \| Website: kingservicetechltd\.com\//g, 'Tel: 0780562454 / 0789379218 / 0796660661 | Addr: Nyamata/Bugesera');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            replaceInFile(fullPath);
        }
    }
}

processDirectory(path.join(__dirname, 'src'));
console.log('Done.');
