const winston = require("winston");
//require("winston-daily-rotate-file");
const CircularJSON = require("circular-json");
// -------------------------------------
//      SETUP LOGGER with Winston
// -------------------------------------
// try to make some pretty output
const alignedWithColorsAndTime = winston.format.combine(
  winston.format.timestamp(),
  winston.format.colorize(),
  winston.format.prettyPrint(),
  winston.format.splat(),
  winston.format.simple(),
  winston.format.printf((info) => {
    if (info.message.constructor === Object) {
      info.message = JSON.stringify(info.message, null, 2);
    }
    let { timestamp, level, message, ...args } = info;
    const ts = timestamp.slice(0, 19).replace("T", " ");
    return `${ts} [${level}]: ${message} ${
      Object.keys(args).length ? CircularJSON.stringify(args, null, 2) : ""
    }`;
  })
);
let configLogger = process.env.LOGGER ? process.env.LOGGER : "info";
const logger = winston.createLogger({
  level: configLogger,
  format: alignedWithColorsAndTime,
  //transports: [transport],
});

logger.add(
  new winston.transports.Console({
    format: alignedWithColorsAndTime,
  })
);
module.exports = logger;
