import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic', // React 19兼容
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: mode === 'development', // 仅开发环境生成sourcemap
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            antd: ['antd', '@ant-design/icons'],
            markdown: ['react-markdown', 'rehype-highlight', 'rehype-sanitize'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      minify: 'esbuild',
      target: 'esnext',
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'antd',
        'zustand',
        '@tanstack/react-query',
      ],
    },
  };
});
