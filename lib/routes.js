var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  var endpointController = req.app.get('endpointController'),
      endpoints = endpointController.getEndpoints();

  return res.render('index', {
    endpoints: endpoints
  });
});

router.post('/', function(req, res, next) {
  var endpointController = req.app.get('endpointController'),
      endpoint_name = req.body['endpoint-name'],
      resource_uri = req.body['resource-uri'],
      resource_value = req.body['resource-value'];

  endpointController.writeResourceValue(endpoint_name, resource_uri, resource_value, function(success) {
    var endpoints = endpointController.getEndpoints();

    return res.render('index', {
      endpoints: endpoints
    });
  });
});

router.put('/webhook', function(req, res, next) {
  console.log('/webhook hit');
  console.log(req.body);

  var endpointController = req.app.get('endpointController');

  if (req.body.notifications) {
    endpointController.handleNotifications(req.body.notifications);
  }

  res.sendStatus(200);
});

module.exports = router;
