"use strict";

var request = require('request'),
    urljoin = require('url-join'),
    events = require('events');

class mbedClient extends events.EventEmitter {
  constructor(host, credentials, options) {
    super();
    this.host = host;
    this.credentials = credentials;

    if (options) {
      if (options.responseCallback) {
        this.requestCallback = options.responseCallback;
      }

      if (options.asyncResponseHandler) {
        this.asyncResponseHandler = asyncResponseHandler;
      }
    }

    this.asyncCallbacks = {};
  }

  modifyOptionsWithAuth(options) {
    if (this.credentials.token) {
      // If a token is set, assume using token authentication
      var domain;
    
      if (options.domain) {
        domain = options.domain;
      } else if (this.credentials.domain) {
        domain = this.credentials.domain;
      } else {
        throw new Error('Using basic auth, but no valid domain found before making request');
      }

      // Remove token authorization header if it exists
      if (options.request.headers && options.request.headers.Authorization) {
        delete options.request.headers.Autorization;
      }

      if (!options.request.headers) {
        options.request.headers = {};
      }

      options.request.headers.Authorization = 'bearer ' + this.credentials.token;
    } else if (this.credentials.username && this.credentials.password) {
      // If a token is not set but a username and password are set, assume using basic auth

      // Remove token authorization header
      if (options.headers && options.headers.Authorization) {
        delete options.headers.Autorization;
      }

      options.request.auth = { user: domain + '/' + this.credentials.username, pass: this.credentials.password };
    }
  }
  
  populateOptions(options, defaultOptions) {
    options = options || {};
  
    if (!options.request) {
      options.request = defaultOptions.request;
    }

    return options;
  }

  requestCallback(error, response, body, callback) {
    if (error || (response && response.statusCode >= 400)) {
      var e = new Error('Request failed');
      e.response = response;
      e.error = error;

      if (response && response.statusCode) {
        e.status = response.statusCode;
      }
    
      callback(e);
    } else {
      if (body) {
        var obj = null;
        try {
          obj = JSON.parse(body);
        } catch (e) {
          // Do nothing here, just catching exception (handled below)
        }

        if (obj && obj["async-response-id"]) {
          this.asyncCallbacks[obj["async-response-id"]] = function(err, body) {
            callback(err, body);
          };
        } else {
          callback(null, body);
        }
      } else {
        callback(null, body);
      }
    }
  }

  makeAuthorizedRequest(options, callback) {
    if (!options.request) {
      throw new Error('No "request" property given in options');
    }

    if (!options.request.url) {
      throw new Error('No "url" property specified in request options');
    }

    this.modifyOptionsWithAuth(options);

    var _this = this;
    request(options.request, function(error, response, body) {
      _this.requestCallback(error, response, body, callback);
    });
  }

  createWebhook(url, callback, options) {
    options = this.populateOptions(options, {
      request: {
        method: 'PUT',
        url: urljoin(this.host, 'notification/callback'),
        json: {url: url}
      }
    });

    this.makeAuthorizedRequest(options, callback);
  }

  registerPreSubscription(preSubscriptionData, callback, options) {
    options = this.populateOptions(options, {
      request: {
        method: 'PUT',
        url: urljoin(this.host, 'subscriptions'),
        json: preSubscriptionData
      }
    });
   
    this.makeAuthorizedRequest(options, callback);
  }

  subscribeToResource(endpoint, resource, callback, options) {
    options = this.populateOptions(options, {
      request: {
        method: 'PUT',
        url: urljoin(this.host, 'subscriptions', endpoint, resource)
      }
    });
 
    this.makeAuthorizedRequest(options, callback);
  }

  getSubscriptionsForResource(endpoint, resource, callback, options) {
    options = this.populateOptions(options, {
      request: {
        method: 'GET',
        url: urljoin(this.host, 'subscriptions', endpoint, resource)
      }
    });
   
    this.makeAuthorizedRequest(options, callback);
  }

  getEndpoints(callback, options) {
    options = this.populateOptions(options, {
      request: {
        url: urljoin(this.host, 'endpoints'),
        headers: {
          accept: 'application/json'
        }
      }
    });
 
    this.makeAuthorizedRequest(options, callback);
  }

  getEndpoint(endpoint, callback, options) {
    options = this.populateOptions(options, {
      request: {
        url: urljoin(this.host, 'endpoints', endpoint),
        headers: {
          accept: 'application/json'
        }
      }
    });
 
    this.makeAuthorizedRequest(options, callback);
  }

  getResource(endpoint, resource, callback, options) {
    options = this.populateOptions(options, {
      request: {
        url: urljoin(this.host, 'endpoints', endpoint, resource),
        headers: {
          accept: '*/*'
        }
      }
    });
 
    this.makeAuthorizedRequest(options, callback);
  }

  putResource(endpoint, resource, value, callback, options) {
    options = this.populateOptions(options, {
      request: {
        method: 'PUT',
        url: urljoin(this.host, 'endpoints', endpoint, resource),
        headers: {
          accept: '*/*'
        },
        body: value.toString()
      }
    });
 
    this.makeAuthorizedRequest(options, callback);
  }

  asyncResponseHandler(asyncResponse, options) {
    if (this.asyncCallbacks[asyncResponse.id]) {
      if (asyncResponse.status >= 400) {
        var e = new Error('Request failed with status ' + asyncResponse.status);
        e.status = asyncResponse.status;
        this.asyncCallbacks[asyncResponse.id](e);
      } else {
        var data = new Buffer(asyncResponse.payload, 'base64');
        this.asyncCallbacks[asyncResponse.id](null, data.toString());
        delete this.asyncCallbacks[asyncResponse.id];
      }
    }
  }

  handleWebhook(payload) {
    if (payload.registrations) {
      this.emit('registrations', payload.registrations);
    }

    if (payload['reg-updates']) {
      this.emit('reg-updates', payload['reg-updates']);
    }

    if (payload["async-responses"]) {
      var _this = this;
      payload['async-responses'].forEach(function(asyncResponse) {
        _this.asyncResponseHandler(asyncResponse);
      });
    }
  }

}

module.exports = mbedClient;
