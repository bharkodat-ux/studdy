import https from 'https';

const url = 'https://text.pollinations.ai/Hello';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data.slice(0, 500));
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
