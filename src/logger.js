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
      Authorization: `Bearer ${config.logging.accountId}:${config.logging.apiKey}`,
      'Content-Type': 'application/json',
    },
  })
    .catch((error) => {
      console.error('Error pushing log:', error);
    });
}

module.exports = { httpLogger, sendLogToGrafana };