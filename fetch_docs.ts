import fs from 'fs';

const data = fs.readFileSync('fetch_docs.ts', 'utf8');
// wait, I fetched the URL directly in fetch_docs
import https from 'https';

https.get('https://gen.pollinations.ai/docs/llm.txt', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const lines = data.split('\n');
    console.log(lines.slice(150, 270).join('\n'));
  });
});
