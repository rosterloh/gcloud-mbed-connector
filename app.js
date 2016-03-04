'use strict';

var express = require('express');
var config = require('./config');
var logging = require('./lib/logging')();
var bodyParser = require('body-parser');

var routes = require('./lib/routes');

var app = express();
var http = require('http').Server(app);

var MbedConnectorApi = require('mbed-connector-api');
var mbedConnectorApi = new MbedConnectorApi({
  accessKey: 'G3OXFXTQBVB1OFLD73JZPRLOKIX7A5TUXSZUMT8P'
});

var EndpointController = require('./lib/endpoint');

var app_url = 'http://home-cloud-server.appspot.com:3000';
var mds_host = 'http://home-cloud-server.appspot.com:8080';

var app_port = process.env.PORT || 3000;

http.listen(app_port, function(){
  console.log('listening on port', app_port);
});

var endpointController = new EndpointController(mbedConnectorApi);

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

// Setup notification channel
mbedConnectorApi.startLongPolling(function(error) {
  if (error) throw error;
  mbedConnectorApi.getEndpoints(function(error, endpoints) {
    if (error) throw error;
    endpoints.forEach(function(endpoint) {
      mbedConnectorApi.getResources(endpoint.name, function(error, resources) {
        if (error) throw error;
        resources.forEach(function(resource) {
          mbedConnectorApi.getResourceValue(endpoint.name, resource.uri, function(error, value) {
            console.log('Endpoint:', endpoint.name);
            console.log('Resource:', resource.uri);
            console.log('Value:', value);
          });
        });
      });
    });
  });
});

module.exports = app;
