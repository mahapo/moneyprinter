const config = require("./config.json");

export const get = (key) => process.env[key] || config[key];
