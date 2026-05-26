import https from 'https';

const data = JSON.stringify({
  model: 'openai',
  messages: [{ role: 'user', content: 'Say hello' }]
});

const options = {
  hostname: 'gen.pollinations.ai',
  port: 443,
  path: '/v1/chat/completions',
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://localhost:3000',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type'
  }
};

const req = https.request(options, (res) => {
  console.log('CORS Headers:');
  console.log(res.headers);
});

req.on('error', (e) => console.error(e));
req.end();
