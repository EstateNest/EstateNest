// API v1 Router - Entry Point
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

// Import route handlers
import authRoutes from './auth/login';
import leadsRoutes from './v1/leads';
import contactsRoutes from './v1/contacts';
import webhookRoutes from './v1/webhooks';

const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'https://www.estatenest.ca'],
  credentials: true,
}));

// Logger
if (process.env.NODE_ENV !== 'production') {
  app.use('*', logger());
}

// Health check
app.get('/api/v1/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount routes
app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/leads', leadsRoutes);
app.route('/api/v1/contacts', contactsRoutes);
app.route('/api/v1/webhooks', webhookRoutes);

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  }, 500);
});

// Not found handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: `Route ${c.req.method} ${c.req.path} not found`,
  }, 404);
});

export default app;
