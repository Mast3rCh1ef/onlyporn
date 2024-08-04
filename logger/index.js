const pino = require('pino');
const logger = new pino({
  level: getLevel(),
  base: {
    pid: undefined,
    hostname: undefined,
  },
  enabled: process.env.LOG_ENABLED === 'true'
});

function getLevel() {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL
  }

  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

module.exports = logger;