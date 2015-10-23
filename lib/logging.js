'use strict';

var fs = require('fs');
var path = require('path');
var winston = require('winston');
var expressWinston = require('express-winston');


module.exports = function() {
  var colorize = process.env.NODE_ENV === 'production' ? false : true;

  // Logger to capture all requests and output them to the console.
  var requestLogger = expressWinston.logger({
    transports: [
      new winston.transports.Console({
        json: false,
        colorize: colorize
      })
    ],
    expressFormat: true,
    meta: false
  });


  // Logger to capture any top-level errors and output json diagnostic info.
  var errorLogger = expressWinston.errorLogger({
    transports: [
      new winston.transports.Console({
        json: true,
        colorize: colorize
      }),
    ]
  });

  return {
    requestLogger: requestLogger,
    errorLogger: errorLogger,
    error: winston.error,
    warn: winston.warn,
    info: winston.info,
    log: winston.log,
    verbose: winston.verbose,
    debug: winston.debug,
    silly: winston.silly
  };

};