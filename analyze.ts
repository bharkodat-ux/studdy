import fs from 'fs';

const data = fs.readFileSync('app.js', 'utf8');

// Find all React component names or English text
// This might be obfuscated, but we can look for strings
const strings = data.match(/(["'`])(?:(?=(\\?))\2.)*?\1/g) || [];
const uniqueStrings = [...new Set(strings)].filter(s => s.length > 20 && s.length < 200).filter(s => !s.match(/^[a-zA-Z0-9_\-\.\/]+$/));

console.log(uniqueStrings.slice(0, 100));
