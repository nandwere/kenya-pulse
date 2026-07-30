const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGINS || '').split(',').filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : '*',
  })
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(generalLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
