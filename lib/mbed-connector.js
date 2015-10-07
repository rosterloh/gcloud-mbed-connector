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

      if (options.useSync) {
        this.useSync = true;
      } else {
        this.useSync = false;
      }
    }

    this.asyncCallbacks = {};
  }

  modifyOptionsWithAuth(options, domain) {
    if (this.credentials.token) {
      // If a token is set, assume using token authentication

      // Remove basic auth
      if (options.auth) {
        delete options.auth;
      }

      if (!options.headers) {
        options.headers = {};
      }

      options.headers.Authorization = 'Bearer ' + this.credentials.token;
    } else if (this.credentials.username && this.credentials.password) {
      // If a token is not set but a username and password are set, assume using basic auth

      // Remove token authorization header
      if (options.headers && options.headers.Authorization) {
        delete options.headers.Autorization;
      }

      options.auth = { user: domain + '/' + this.credentials.username, pass: this.credentials.password };
    }
  }

  requestCallback(error, response, body, callback) {
    if (error || response.statusCode >= 400) {
      var e = new Error('Request failed with status ' + response.statusCode);
      e.status = response.statusCode;
      callback(e, null);
    } else {
      if (body) {
        var obj = null;
        try {
          obj = JSON.parse(body);
        } catch (e) {
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

  makeAuthorizedRequest(options, domain, callback, sync) {
    if (!options.url) {
      throw new Error('No "url" property specified in request options');
    }

    if (sync) {
      options.url += '?sync=true';
    }

    this.modifyOptionsWithAuth(options, domain);

    var _this = this;
    request(options, function(error, response, body) {
      _this.requestCallback(error, response, body, callback);
    });
  }

  createWebhook(domain, url, callback) {
    var options = {
      method: 'PUT',
      url: urljoin(this.host, 'notification/callback'),
      json: {url: url}
    };

    this.makeAuthorizedRequest(options, domain, callback);
  }

  registerPreSubscription(domain, preSubscriptionData, callback) {
    var options = {
      method: 'PUT',
      url: urljoin(this.host, 'subscriptions'),
      json: preSubscriptionData
    };

    this.makeAuthorizedRequest(options, domain, callback);
  }

  subscribeToResource(domain, endpoint, resource, callback, sync) {
    var options = {
      method: 'PUT',
      url: urljoin(this.host, 'subscriptions', endpoint, resource)
    };

    this.makeAuthorizedRequest(options, domain, callback, sync);
  }

  getSubscriptionsForResource(domain, endpoint, resource, callback) {
    var options = {
      method: 'GET',
      url: urljoin(this.host, 'subscriptions', endpoint, resource)
    };

    this.makeAuthorizedRequest(options, domain, callback);
  }

  getEndpoints(domain, callback) {
    var options = {
      url: urljoin(this.host, 'endpoints'),
      headers: {
        accept: 'application/json'
      }
    };

    this.makeAuthorizedRequest(options, domain, callback);
  }

  getEndpoint(domain, endpoint, callback) {
    var options = {
      url: urljoin(this.host, 'endpoints', endpoint),
      headers: {
        accept: 'application/json'
      }
    };
    this.makeAuthorizedRequest(options, domain, callback);
  }

  getResource(domain, endpoint, resource, callback, sync) {
    var options = {
      url: urljoin(this.host, 'endpoints', endpoint, resource),
      headers: {
        accept: '*/*'
      }
    };
    this.makeAuthorizedRequest(options, domain, callback, sync);
  }

  putResource(domain, endpoint, resource, value, callback, sync) {
    var options = {
      method: 'PUT',
      url: urljoin(this.host, 'endpoints', endpoint, resource),
      headers: {
        accept: '*/*'
      },
      body: value.toString()
    };

    this.makeAuthorizedRequest(options, domain, callback, sync);
  }

  asyncResponseHandler(asyncResponse) {
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
