import * as config from './config.json';
export const get = (key) => process.env[key] || config[key];
