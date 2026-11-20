const config = require('./config.js');

function httpLogger(req, res, next) {
  res.once('finish', () => {
    sendLogToGrafana({
      method: req.method,
      path: req.path,
      status: res.statusCode,
    });
  });
  next();
}

function sendLogToGrafana(entry) {
  const credentials = `${config.logging.accountId}:${config.logging.apiKey}`;
  const body = JSON.stringify({
    streams: [
      {
        stream: { source: config.logging.source },
        values: [[`${Date.now() * 1000000}`, JSON.stringify(entry)]],
      },
    ],
  });

  fetch(config.logging.endpointUrl, {
    method: 'POST',
    body,
    headers: {
      Authorization: `Basic ${Buffer.from(credentials).toString('base64')}`,
      'Content-Type': 'application/json',
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text();
        console.error(`Failed to push log: ${response.status} ${text}`);
      }
    })
    .catch((error) => {
      console.error('Error pushing log:', error);
    });
}

module.exports = { httpLogger, sendLogToGrafana };