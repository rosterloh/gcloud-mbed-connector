'use strict';

var express = require('express');
var config = require('./config');
var logging = require('./lib/logging')();
var bodyParser = require('body-parser');

var routes = require('./lib/routes');

var app = express();
var http = require('http').Server(app);
var urljoin = require('url-join');

var MbedConnector = require('./lib/mbed-connector');
var EndpointController = require('./lib/endpoint');
/*
var mds_credentials = {
  username: 'rosterloh84',
  password: 'sparky'
};
*/

var mds_domain = 'rosterloh84';
var mds_credentials = {
  domain: mds_domain,
  token: 'NNIQ2SYSK0CKRTLLIQBB7JPD39LHY9L9PN363GBX'
};

var app_url = 'http://home-cloud-server.appspot.com:3000';

var mds_host = 'http://home-cloud-server.appspot.com:8080';

var app_port = process.env.PORT || 3000;

http.listen(app_port, function(){
  console.log('listening on port', app_port);
});

var mbedConnector = new MbedConnector(mds_host, mds_credentials);
var endpointController = new EndpointController(mbedConnector, mds_domain);

app.set('endpointController', endpointController);

// Add the request logger before anything else so that it can
// accurately log requests.
app.use(logging.requestLogger);

// OAuth2
var oauth2 = require('./lib/oauth2')(config.oauth2);
app.use(oauth2.router);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use('/', routes);

// Our application will need to respond to health checks when running on
// Compute Engine with Managed Instance Groups.
app.get('/_ah/health', function(req, res) {
  res.status(200).send('ok');
});


// Add the error logger after all middleware and routes so that
// it can log errors from the whole application. Any custom error
// handlers should go after this.
app.use(logging.errorLogger);

// Basic error handler.
app.use(function(err, req, res, next) {
  res.status(500).send('Something broke!');
});

// Start the server
var server = app.listen(config.port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
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

  mbedConnector.registerPreSubscription(preSubscriptionData, function(error, response, body) {
    if (error || (response && response.statusCode >= 400)) {
      console.error('Pre-subscription registration failed.');
    } else {
      endpointController.fetchEndpoints();
    }
  });
}

createWebhook();

module.exports = app;