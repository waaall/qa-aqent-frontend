module.exports = {
  apps: [
    {
      name: 'qa-frontend-dev',
      script: 'npm',
      args: 'run dev',
      interpreter: 'none',  // 关键：告诉 PM2 不要用 node 解释器
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
