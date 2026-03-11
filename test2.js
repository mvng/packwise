const https = require('https');
https.get('https://nextjs.org/docs/messages/middleware-relative-urls', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // extract body text
    console.log(data);
  });
}).on('error', (err) => {
  console.log("Error: " + err.message);
});
