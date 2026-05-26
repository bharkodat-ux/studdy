import https from 'https';
import fs from 'fs';

https.get('https://study-buddy-bdaf6ec8.base44.app/static/index-CsXj9PmQ.js', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    fs.writeFileSync('app.js', data);
    console.log('Done downloading');
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
