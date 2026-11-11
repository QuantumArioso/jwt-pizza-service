const config = require('./config');

const requests = Object.create(null);

setInterval(() => {
  Object.entries(requests).forEach(([endpoint, count]) => {
    const [method, ...pathParts] = endpoint.split(' ');
    sendMetricToGrafana('http_requests_per_minute', count, 'gauge', '1', {
      method,
      path: pathParts.join(' '),
    });
  });

  Object.keys(requests).forEach((endpoint) => {
    delete requests[endpoint];
  });
}, 60 * 1000);

function requestTracker(req, res, next) {
  const endpoint = `[${req.method}] ${req.path}`;
  requests[endpoint] = (requests[endpoint] || 0) + 1;
  next();
}

function sendMetricToGrafana(metricName, metricValue, type, unit, attributes = {}) {
  const metric = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics: [
              {
                name: metricName,
                unit: unit,
                [type]: {
                  dataPoints: [
                    {
                      asInt: metricValue,
                      timeUnixNano: Date.now() * 1000000,
                      attributes: Object.entries({ source: config.metrics.source, ...attributes }).map(([key, value]) => ({
                        key,
                        value: { stringValue: value },
                      })),
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  };

  if (type === 'sum') {
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0][type].aggregationTemporality = 'AGGREGATION_TEMPORALITY_CUMULATIVE';
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0][type].isMonotonic = true;
  }

  const body = JSON.stringify(metric);
  fetch(config.metrics.endpointUrl, {
    method: 'POST',
    body: body,
    headers: { Authorization: `Bearer ${config.metrics.accountId}:${config.metrics.apiKey}`, 'Content-Type': 'application/json' },
  })
    .then((response) => {
      if (!response.ok) {
        response.text().then((text) => {
          console.error(`Failed to push metrics data to Grafana: ${text}\n${body}`);
        });
      } else {
        console.log(`Pushed ${metricName}`);
      }
    })
    .catch((error) => {
      console.error('Error pushing metrics:', error);
    });
}

  module.exports = { requestTracker };