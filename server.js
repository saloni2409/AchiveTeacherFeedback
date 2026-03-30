import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

// Provide detailed logs to stop silent crashes
process.on('uncaughtException', (err) => {
  console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL UNHANDLED REJECTION:', reason);
});

console.log('--- SERVER STARTING UP ---');
console.log(`Raw process.env.PORT from Cloud Run: ${process.env.PORT}`);
console.log(`AI_PROVIDER: ${process.env.AI_PROVIDER || '(not set, defaulting to anthropic)'}`);
console.log(`AI_API_KEY: ${process.env.AI_API_KEY ? '✅ present (' + process.env.AI_API_KEY.slice(0,6) + '...)' : '❌ NOT SET'}`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Safely parse the port to an integer
const port = parseInt(process.env.PORT || '8080', 10);

console.log(`Server will attempt to bind to port: ${port}`);

// Simple healthcheck endpoint so Google Cloud Run knows we are alive
app.get('/health', (req, res) => {
  res.status(200).send("OK");
});

// Runtime config for the frontend (uses non-VITE_ env vars, available at runtime)
app.get('/api/config', (req, res) => {
  res.json({ provider: process.env.AI_PROVIDER || 'anthropic' });
});

// Inject API key headers before proxying — reads from runtime env vars so the
// key never needs to be baked into the Vite build at image build time.
app.use('/api/anthropic', (req, _res, next) => {
  const key = process.env.AI_API_KEY;
  if (key) req.headers['x-api-key'] = key;
  next();
}, createProxyMiddleware({
  target: 'https://api.anthropic.com',
  changeOrigin: true,
  pathRewrite: { '^/api/anthropic': '' },
}));

app.use('/api/openai', (req, _res, next) => {
  const key = process.env.AI_API_KEY;
  if (key) req.headers['authorization'] = `Bearer ${key}`;
  next();
}, createProxyMiddleware({
  target: 'https://api.openai.com',
  changeOrigin: true,
  pathRewrite: { '^/api/openai': '' },
}));

app.use('/api/grok', (req, _res, next) => {
  const key = process.env.AI_API_KEY;
  if (key) req.headers['authorization'] = `Bearer ${key}`;
  next();
}, createProxyMiddleware({
  target: 'https://api.x.ai',
  changeOrigin: true,
  pathRewrite: { '^/api/grok': '' },
}));

app.use('/api/gemini', (req, _res, next) => {
  const key = process.env.AI_API_KEY;
  if (key) {
    const sep = req.url.includes('?') ? '&' : '?';
    req.url += `${sep}key=${encodeURIComponent(key)}`;
  }
  next();
}, createProxyMiddleware({
  target: 'https://generativelanguage.googleapis.com',
  changeOrigin: true,
  pathRewrite: { '^/api/gemini': '' },
}));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// Catchall
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`✅ SUCCESS! Server is actively listening on port ${port} and bound to 0.0.0.0`);
});
