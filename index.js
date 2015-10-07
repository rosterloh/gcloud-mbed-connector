var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');

var routes = require('./lib/routes');

var app = express();

var MbedConnector = require('./lib/mbed-connector');
var EndpointController = require('./lib/endpoint');
/*
var mds_credentials = {
  username: 'rosterloh84',
  password: 'sparky'
};
*/
var mds_credentials = {
  token: 'NNIQ2SYSK0CKRTLLIQBB7JPD39LHY9L9PN363GBX'
};

var app_url = 'http://iot-hack-mds.cloudapp.net:3000';

var mds_host = 'http://iot-hack-mds.cloudapp.net:8080';
var mds_domain = 'rosterloh84';
var app_port = process.env.PORT || 3000;

http.listen(app_port, function(){
  console.log('listening on port', app_port);
});

var mbedConnector = new MbedConnector(mds_host, mds_credentials);
var endpointController = new EndpointController(mbedConnector, mds_domain);

app.set('endpointController', endpointController);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


function createWebhook() {
  var url = urljoin(app_url, 'webhook');
  mbedConnector.createWebhook(mds_domain, url, function(error, response, body) {
    if (error || (response && response.statusCode >= 400)) {
      console.error('Webhook registration failed.');
    } else {
      registerPreSubscription();
    }
  });
}

function registerPreSubscription() {
  var preSubscriptionData = [
    {
      "endpoint-name": "light-and-potentiometer",
      "resource-path": ["/LightSensor/0/L", "/LED/0/R"]
    }
  ];

  mbedConnector.registerPreSubscription(mds_domain, preSubscriptionData, function(error, response, body) {
    if (error || (response && response.statusCode >= 400)) {
      console.error('Pre-subscription registration failed.');
    } else {
      endpointController.fetchEndpoints();
    }
  });
}

createWebhook();

module.exports = app;
