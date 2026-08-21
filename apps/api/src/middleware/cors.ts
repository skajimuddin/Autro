import { cors } from 'hono/cors'

/**
 * CORS middleware for the Autro API.
 *
 * Allows requests from the frontend origin (VITE_APP_URL env var) as well as
 * localhost for local development. Falls back to the Hono built-in cors helper
 * so all the correct response headers are set automatically.
 *
 * Usage:
 *   app.use('*', corsMiddleware)
 */
export const corsMiddleware = cors({
  // Allow the production frontend domain + local dev origins
  origin: [
    'http://localhost:5173', // Vite default
    'http://localhost:4173', // Vite preview
    'https://autro.zeonweb.com',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  credentials: true,
})
