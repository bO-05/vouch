/**
 * Unified API Configuration for Local Dev and Production Deployment
 * Supports relative URLs (/api/*) in standard reverse-proxy/SPA setups,
 * and VITE_API_URL / SOLANA_RPC_URL environment variables in multi-domain setups
 * (e.g. Frontend on Vercel/Netlify, Backend on Render/Railway/Docker).
 */

const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;

export const API_BASE_URL: string = (metaEnv?.VITE_API_URL ? String(metaEnv.VITE_API_URL) : '').replace(/\/$/, '');

export const SOLANA_RPC_URL: string = (
  metaEnv?.VITE_SOLANA_RPC_URL ||
  metaEnv?.SOLANA_RPC_URL ||
  'https://api.devnet.solana.com'
).trim();

export function apiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanEndpoint}` : cleanEndpoint;
}
