module.exports = {
  apps: [
    {
      name: "moneyprinter",
      cwd: "./backend",
      script: "yarn",
      args: "start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
      },
      // watch: true,
      // ignore_watch: ['node_modules']
    },
  ],

  deploy: {
    production: {
      user: "root",
      host: "104.248.141.30",
      ref: "origin/master",
      repo: "https://github.com/mahapo/decentralex-bots.git",
      path: "/var/www/decentralex-bots",
      "post-deploy":
        "cd backend && yarn && yarn build && pm2 reload ../ecosystem.config.js --env production",
    },
  },
};
