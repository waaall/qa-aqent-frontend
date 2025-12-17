/* global module */

module.exports = {
  apps: [
    {
      name: 'qa-frontend-dev',
      // 直接运行 vite - 跨平台兼容
      script: 'node',
      args: './node_modules/vite/bin/vite.js',
      env: {
        NODE_ENV: 'development'
      },
      // 可选配置
      watch: false, // 文件变化时是否重启 Vite 服务器
      autorestart: true,
      max_restarts: 5,
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
