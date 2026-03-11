const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const targetDir = path.join('E:', 'no borrar', 'fulbitoo', 'frontend', 'src');
const files = walk(targetDir);
let changedCount = 0;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;
    
    // Replace standard tailwind uppercase
    content = content.replace(/(["'`\s])uppercase(["'`\s])/g, '$1capitalize$2');
    
    if (content !== original) {
        fs.writeFileSync(f, content);
        changedCount++;
    }
});

console.log(`Replaced uppercase with capitalize in ${changedCount} files.`);
