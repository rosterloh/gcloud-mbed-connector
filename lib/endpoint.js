"use strict";

/**
 * @class EndpointController
 */
class EndpointController {
  constructor(mbedConnector, mds_domain) {
    this.mbedConnector = mbedConnector;
    this.mds_domain = mds_domain;
    this.endpoints = {};
    this.asyncCallbacks = {};
  }

  addEndpoint(endpoint) {
    if (!this.endpoints[endpoint.name]) {
      var _this = this;

      this.endpoints[endpoint.name] = endpoint;
    }
  }

  handleNotifications(notifications) {
    var _this = this;
    notifications.forEach(function(notification) {
      if (notification.path === '/LightSensor/0/L' || notification.path === '/LED/0/R') {
        var buffer = new Buffer(notification.payload, 'base64'),
            endpoint = _this.endpoints[notification.ep];
        _this.updateResourceValue(endpoint, notification.path, buffer.toString());
      }
    });
  }

  getResourceValue(endpoint, resourceURI, callback) {
    var _this = this;
    this.mbedConnector.getResource(this.mds_domain, endpoint.name, resourceURI, function(error, response, body) {
      if (error || response.statusCode >= 400) {
        console.log(error);
        console.log(response.statusCode);
        console.error('Get resource ' + resourceURI + ' failed.');
      } else if (body) {
        callback(body);
      }
    }, true);
  }

  updateResourceValue(endpoint, resourceURI, value) {
    var _this = this;
    console.log('Updating resource ' + resourceURI);
    var resources = endpoint.resources.filter(function(resource) {
      return resource.uri == resourceURI;
    });

    if (!resources.length) {
      // Remove leading slash
      var name = resourceURI.substring(1);
      // Replace slashes with hyphens
      name = name.replace("/","-");
      endpoint.resources.push({
        name: name,
        uri: resourceURI,
        value: value
      });
    } else {
      resources[0].value = value;
    }
  }

  writeResourceValue(endpoint, resourceURI, value, callback) {
    var _this = this;
    console.log('Writing resource ' + resourceURI);

    this.mbedConnector.putResource(this.mds_domain, endpoint, resourceURI, value, function(error, response, body) {
      if (error || response.statusCode >= 400) {
        console.log(error);
        console.log(response.statusCode);
        console.error('Put resource ' + resourceURI + ' failed.');
        callback(false);
      } else {
        var resources = _this.endpoints[endpoint].resources.filter(function(resource) {
          return resource.uri === resourceURI;
        });

        resources[0].value = value;

        callback(true);
      }
    }, true);
  }

  fetchEndpoints() {
    var _this = this;
    console.log('Fetching endpoints');
    this.mbedConnector.getEndpoint(this.mds_domain, 'light-and-potentiometer', function(error, response, body) {
      if (error || response.statusCode >= 400) {
        console.error('Fetch endpoint failed.');
      } else if (body) {
        endpoint = {
          name: 'light-and-potentiometer',
          resources: []
        };
        console.log(endpoint);
        _this.getResourceValue(endpoint, '/LED/0/R', function(value) {
          _this.updateResourceValue(endpoint, '/LED/0/R', value);
          _this.getResourceValue(endpoint, '/LightSensor/0/L', function(value) {
            _this.updateResourceValue(endpoint, '/LightSensor/0/L', value);
            _this.addEndpoint(endpoint);
          });
        });
      }
    });
  }

  getEndpoints() {
    var _endpoints = this.endpoints;
    var keys = Object.keys(_endpoints);
    var ret = [];

    keys.sort();

    keys.forEach(function(key) {
      ret.push(_endpoints[key]);
    });

    return ret;
  }
}

module.exports = EndpointController;
