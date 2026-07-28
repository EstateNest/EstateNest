// API Server for EstateNest Management System
// Run with: npm run dev:api

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Import routes
import authRoutes from './auth/login';
import leadsRoutes from './v1/leads';
import contactsRoutes from './v1/contacts';
import webhookRoutes from './v1/webhooks';

const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: (origin) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://www.estatenest.ca').split(',');
    return allowedOrigins.includes(origin || '') ? origin : allowedOrigins[0];
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Logger (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use('*', logger());
}

// Request timing
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  c.res.headers.set('X-Response-Time', `${Date.now() - start}ms`);
});

// Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount API routes
app.route('/api/auth', authRoutes);
app.route('/api/leads', leadsRoutes);
app.route('/api/contacts', contactsRoutes);
app.route('/api/webhooks', webhookRoutes);

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    path: c.req.path,
    method: c.req.method,
  }, 404);
});

const port = parseInt(process.env.PORT || '3001', 10);

console.log(`
╔═══════════════════════════════════════════════════════════╗
║   EstateNest Management API Server                      ║
╠═══════════════════════════════════════════════════════════╣
║   Running on: http://localhost:${port}                      ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(14)}                        ║
╚═══════════════════════════════════════════════════════════╝
`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`API Server started on port ${port}`);
