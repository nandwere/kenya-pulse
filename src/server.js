require('dotenv').config();
const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

const start = async () => {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`Kenya Citizen Pulse API running on port ${env.port}`);
  });
};

start();
