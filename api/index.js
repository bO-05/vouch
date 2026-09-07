import app from '../server/index.js';

/**
 * Vercel Serverless Function Entrypoint
 * Handles URL normalization when Vercel rewrites /api/(.*) or routes to serverless functions
 */
export default function handler(req, res) {
  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const pathParam = urlObj.searchParams.get('__path') || req.query?.__path;

    if (pathParam !== undefined && pathParam !== null) {
      const rawPath = Array.isArray(pathParam) ? pathParam.join('/') : String(pathParam);
      const cleanPath = rawPath.replace(/^\/+/, '');
      urlObj.searchParams.delete('__path');
      if (req.query && req.query.__path) {
        delete req.query.__path;
      }
      const remainingQuery = urlObj.searchParams.toString();
      req.url = `/api/${cleanPath}` + (remainingQuery ? `?${remainingQuery}` : '');
    } else if (req.headers['x-matched-path'] && req.headers['x-matched-path'].startsWith('/api/')) {
      req.url = req.headers['x-matched-path'];
    } else if (req.url && !req.url.startsWith('/api')) {
      req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
    }

    if (req.body !== undefined) {
      if (typeof req.body === 'string') {
        try {
          req.body = JSON.parse(req.body);
        } catch (e) {
          // Ignore parsing errors for non-JSON payloads
        }
      }
      // Shield against Express body-parser hanging on pre-consumed Vercel streams
      req._body = true;
    }
  } catch (err) {
    console.warn('[Vercel Serverless Handler] URL normalization notice:', err);
  }

  return app(req, res);
}

