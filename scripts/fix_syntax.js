const fs = require('fs');
const path = require('path');

const EXCLUDE_DIRS = ['node_modules', '.git', 'client/node_modules', 'face_recognition_data', 'face_data'];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    const relativePath = path.relative(process.cwd(), fullPath);
    
    if (fs.statSync(fullPath).isDirectory()) {
      if (!EXCLUDE_DIRS.some(exclude => relativePath.startsWith(exclude)) && file !== 'node_modules') {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

function fixEmptyArrows(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find "=>" followed by whitespace and then a closing char: ) } ] , ;
  // Replace with "=> {}"
  const regex = /=>\s*(?=[)}\],;])/g;
  
  const newContent = content.replace(regex, '=> {}');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Fixed syntax in: ${filePath}`);
  }
}

console.log('Searching for syntax errors...');
const allFiles = getAllFiles(process.cwd());
allFiles.forEach(fixEmptyArrows);
console.log('Done.');
