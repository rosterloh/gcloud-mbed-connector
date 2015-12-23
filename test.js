var express = require('express');
var MbedConnector = require('mbed-connector');

var app = express();

var credentials = {
  token: 'G3OXFXTQBVB1OFLD73JZPRLOKIX7A5TUXSZUMT8P'
};

var url = 'http://127.0.0.1';
var port = 80;

var mbedConnector = new MbedConnector('https://api.connector.mbed.com', credentials);

app.set('mbedConnector', mbedConnector);

// Setup webhook route to handle PUT requests
app.put('/webhook', function (req, res) {
  if (req.body) {
    var mbedConnector = req.app.get('mbedConnector');
    // Let the mbed Device Connector Service library handle the webhook payload
    mbedConnector.handleWebhook(req.body);
  }

  res.sendStatus(200);
});

var server = app.listen(port, function () {
  console.log('Example app listening at %s:%s', url, port);

  // Register your webhook route
  mbedConnector.createWebhook(url + '/webhook', function(error) {
    if (error) {
      console.error('webhook registration failed');
    } else {
      console.log('webhook registration succeeded');
    }
  });
});
