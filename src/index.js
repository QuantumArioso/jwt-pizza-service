const app = require('./service.js');
const logger = require('./logger.js');

const port = process.argv[2] || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

app.use((err, req, res) => {
  logger.log('unhandled_exception', 'exception', {
    message: logger.sanitize(err.message),
    stack: err.stack,
    method: req.method,
    path: req.path,
  });

  // Send a standard error response to the user
  res.status(err.status || 500).json({
    message: 'An unexpected error occurred.',
  });
});