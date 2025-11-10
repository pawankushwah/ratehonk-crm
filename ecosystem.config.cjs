module.exports = {
  apps: [{
    name: 'ratehonk-crm',
    script: 'dist/index.js',
    cwd: '/home/ratehonk',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: '/home/ratehonk/logs/err.log',
    out_file: '/home/ratehonk/logs/out.log',
    log_file: '/home/ratehonk/logs/combined.log',
    time: true
  }]
};