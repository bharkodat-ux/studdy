import https from 'https';

const data = JSON.stringify({
  model: 'openai',
  messages: [{ role: 'user', content: 'Say hello' }]
});

const options = {
  hostname: 'gen.pollinations.ai',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let resData = '';
  res.on('data', (d) => resData += d);
  res.on('end', () => console.log(resData));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
