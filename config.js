'use strict';

var config = module.exports = {
  port: process.env.PORT || 8080,

  // Secret is used by sessions to encrypt the cookie.
  secret: process.env.SESSION_SECRET || 'your-secret-here',

  // dataBackend can be 'datastore', 'cloudsql', or 'mongodb'. Be sure to
  // configure the appropriate settings for each storage engine below.
  // If you are unsure, use datastore as it requires no additional
  // configuration.
  dataBackend: 'datastore',

  // This is the id of your project in the Google Developers Console.
  gcloud: {
    projectId: process.env.GCLOUD_PROJECT || 'home-cloud-server'
  },

  // Typically, you will create a bucket with the same name as your project ID.
  cloudStorageBucket: process.env.CLOUD_BUCKET || 'home-cloud-server',

  // The client ID and secret can be obtained by generating a new web
  // application client ID on Google Developers Console.
  oauth2: {
    clientId: process.env.OAUTH_CLIENT_ID || 'your-client-id',
    clientSecret: process.env.OAUTH_CLIENT_SECRET || 'your-client-secret',
    redirectUrl: process.env.OAUTH2_CALLBACK || 'http://localhost:8080/oauth2callback',
    scopes: ['email', 'profile']
  }
};

var projectId = config.gcloud.projectId;
var cloudStorageBucket = config.cloudStorageBucket;
var clientId = config.oauth2.clientId;
var clientSecret = config.oauth2.clientSecret;

if (!projectId || projectId === 'your-project-id') {
  throw new Error('You must set the GCLOUD_PROJECT env var or add your ' +
    'project id to config.js!');
}

if (!cloudStorageBucket || cloudStorageBucket === 'your-bucket-name') {
  throw new Error('You must set the CLOUD_BUCKET env var or add your ' +
    'bucket name to config.js!');
}

if (!clientId || clientId === 'your-client-id') {
  throw new Error('You must set the OAUTH_CLIENT_ID env var or add your ' +
    'client id to config.js!');
}

if (!clientSecret || clientSecret === 'your-client-secret') {
  throw new Error('You must set the OAUTH_CLIENT_SECRET env var or add your ' +
    'client secret config.js!');
}
