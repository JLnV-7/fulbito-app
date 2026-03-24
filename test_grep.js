const fs = require('fs');
const path = require('path');

function searchFiles(dir, text) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchFiles(fullPath, text);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes(text)) {
        console.log("FOUND IN:", fullPath);
      }
    }
  }
}

searchFiles('./frontend/src', 'ESTADÍSTICAS');
searchFiles('./frontend/src', 'Detalle del Partido');
