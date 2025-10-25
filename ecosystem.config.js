module.exports = {
  apps: [{
    name: 'flowsvault',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true
  }]
};
