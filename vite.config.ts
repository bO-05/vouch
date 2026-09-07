import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis'
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('node_modules')) {
            if (
              normalized.includes('/@solana/') ||
              normalized.includes('/@noble/') ||
              normalized.includes('/bn.js/') ||
              normalized.includes('/borsh/') ||
              normalized.includes('/bs58/') ||
              normalized.includes('/base-x/') ||
              normalized.includes('/buffer/') ||
              normalized.includes('/base64-js/') ||
              normalized.includes('/ieee754/') ||
              normalized.includes('/safe-buffer/') ||
              normalized.includes('/rpc-websockets/') ||
              normalized.includes('/jayson/') ||
              normalized.includes('/superstruct/') ||
              normalized.includes('/text-encoding-utf-8/') ||
              normalized.includes('/eventemitter3/') ||
              normalized.includes('/uuid/')
            ) {
              return 'vendor-solana';
            }
            if (
              normalized.includes('/react/') ||
              normalized.includes('/react-dom/') ||
              normalized.includes('/scheduler/')
            ) {
              return 'vendor-react';
            }
            if (
              normalized.includes('/lucide-react/')
            ) {
              return 'vendor-icons';
            }
            if (
              normalized.includes('/d3-geo/') ||
              normalized.includes('/d3-array/') ||
              normalized.includes('/internmap/') ||
              normalized.includes('/topojson-client/') ||
              normalized.includes('/world-atlas/')
            ) {
              return 'vendor-geo';
            }
            if (
              normalized.includes('/qrcode/') ||
              normalized.includes('/dijkstrajs/')
            ) {
              return 'vendor-qrcode';
            }
          } else if (normalized.includes('/src/data/worldMapPaths')) {
            return 'map-paths';
          } else if (
            normalized.includes('/src/components/MicroGrantModal') ||
            normalized.includes('/src/components/FulfillmentProofModal') ||
            normalized.includes('/src/components/ProofOfGenerosityModal') ||
            normalized.includes('/src/components/VoiceRecorderModal') ||
            normalized.includes('/src/components/SnowflakeWarehouseModal') ||
            normalized.includes('/src/components/NonprofitVerifyModal') ||
            normalized.includes('/src/components/UNReliefWebModal') ||
            normalized.includes('/src/components/JudgeSandboxModal') ||
            normalized.includes('/src/components/SystemHealthModal')
          ) {
            return 'ui-modals';
          }
        }
      }
    }
  },
  preview: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
