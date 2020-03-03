const path = require("path");
const fs = require("fs");
const config = require("./../config/config");
const {Signale} = require('signale');
const time = require("./time");

const options = {
  disabled: false,
  displayTimestamp: true,
  interactive: false,
  // In production by default we log to file, otherwise print to console. We can also provide an env variable.
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV !== "production" ? "info" : "error"),
  scope: process.env.NODE_ENV,
  secrets: [],
  // In production we only write to the log file.
  stream: process.env.NODE_ENV !== "production" ? process.stdout : fs.createWriteStream(path.join(__dirname, "/../", config.log.replace("[time]", time.now())), { flags: 'a' }),
};

const customLogger = new Signale(options);

customLogger.config({
  displayTimestamp: true,
  displayDate: true,
});

if (process.env.NODE_ENV !== "production") {
  // Maybe log differently.
}

module.exports = {
  info(...args) {
    customLogger.info.apply(undefined, args);
  },
  error(...args) {
    customLogger.error.apply(undefined, args);
  },
  debug(...args) {
    customLogger.debug.apply(undefined, args);
  },
  success(...args) {
    customLogger.success.apply(undefined, args);
  }
};