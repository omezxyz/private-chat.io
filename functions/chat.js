const express = require('express');
const app = express();

// Your Express routes
app.get('/', (req, res) => {
  res.send('Hello from the serverless Express function!');
});

// Wrap your Express app in a lambda handler
const serverless = require('serverless-http');
module.exports.handler = serverless(app);
