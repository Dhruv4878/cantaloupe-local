module.exports = {
  apps: [
    {
      name: 'pg-api',
      script: 'server.js',
      cwd: __dirname,
      env: {
        NODE_ENV: process.env.NODE_ENV || 'development',
      },
      watch: false,
    },
    {
      name: 'pg-queue-worker',
      script: 'src/workers/queueWorker.js',
      cwd: __dirname,
      env: {
        NODE_ENV: process.env.NODE_ENV || 'development',
      },
      watch: false,
    },
    {
      name: 'pg-schedule-worker',
      script: 'src/workers/scheduleWorker.js',
      cwd: __dirname,
      env: {
        NODE_ENV: process.env.NODE_ENV || 'development',
      },
      watch: false,
    },
  ],
};

