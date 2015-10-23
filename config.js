'use strict';

module.exports = {
  port: process.env.PORT || 8080,

  // Secret is used by sessions to encrypt the cookie.
  secret: 'your-secret-here',

  // dataBackend can be 'datastore', 'cloudsql', or 'mongodb'. Be sure to
  // configure the appropriate settings for each storage engine below.
  // If you are unsure, use datastore as it requires no additional
  // configuration.
  dataBackend: 'datastore',

  // This is the id of your project in the Google Developers Console.
  gcloud: {
    projectId: 'home-cloud-server'
  },

  // Typically, you will create a bucket with the same name as your project ID.
  cloudStorageBucket: 'home-cloud-server',

  // The client ID and secret can be obtained by generating a new web
  // application client ID on Google Developers Console.
  oauth2: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    redirectUrl: process.env.OAUTH2_CALLBACK || 'http://localhost:8080/oauth2callback',
    scopes: ['email', 'profile']
  },
};