const fs = require('fs-extra');

/**
 * Module for VCAP Constants
 * @module vcap-constants
 */

const vcapApplication = JSON.parse(process.env.VCAP_APPLICATION || '{"uris":["http://localhost:8080"]}');

const vcapConstants = {};

vcapConstants.nodeEnv = process.env.NODE_ENV;

/** VCAP environment variables are used by cloud.gov to pass in instance specific settings. */
let vcapServices;
if (process.env.VCAP_SERVICES) {
  vcapServices = JSON.parse(process.env.VCAP_SERVICES);
} else {
  if (process.env.NODE_ENV === 'test') {
    vcapServices = JSON.parse(fs.readFileSync('environment-variables/test.json', 'utf8'));
  } else {
    vcapServices = JSON.parse(fs.readFileSync('environment-variables/local.json', 'utf8'));
  }

  if (process.env.AWS_CONFIG) {
    vcapServices.s3 = JSON.parse(process.env.AWS_CONFIG).s3;
  } else {
    vcapServices.s3 = JSON.parse(fs.readFileSync('environment-variables/aws-config.json', 'utf8')).s3;
  }
}

const getUserProvided = (name, required = true) => {
  const userProvided = vcapServices['user-provided'].find(element => element.name === name);

  if (!userProvided && required) {
    throw new Error(`No user provided service: ${name}`);
  }

  return userProvided ? userProvided.credentials : null;
};

/** Base URL of this instance */
vcapConstants.BASE_URL = `https://${vcapApplication.uris[0]}`;

/** Feature Flags */
const featureFlags = getUserProvided('feature-flags', false) || {};
vcapConstants.FEATURES = {
  MOCK_ADMIN_AUTH: featureFlags.mock_admin_auth === true,
  MOCK_PUBLIC_AUTH: featureFlags.mock_public_auth === true,
  MOCK_PAY_GOV: featureFlags.mock_pay_gov === true,
  NEW_RELIC: !(featureFlags.new_relic === false)
};

/** jwt token used to generate permit confirmation URL * */
const jwt = getUserProvided('jwt');
vcapConstants.PERMIT_SECRET = jwt.permit_secret;

/** S3 BUCKET settings */
const intakeS3 = vcapServices.s3.find(element => element.name === 'intake-s3');
if (intakeS3.credentials.access_key_id && intakeS3.credentials.secret_access_key) {
  vcapConstants.accessKeyId = intakeS3.credentials.access_key_id;
  vcapConstants.secretAccessKey = intakeS3.credentials.secret_access_key;
}
vcapConstants.REGION = intakeS3.credentials.region;
vcapConstants.BUCKET = intakeS3.credentials.bucket;

/** Middle layer settings */
const middlelayerService = getUserProvided('middlelayer-service');
vcapConstants.MIDDLE_LAYER_BASE_URL = middlelayerService.middlelayer_base_url;
vcapConstants.MIDDLE_LAYER_USERNAME = middlelayerService.middlelayer_username;
vcapConstants.MIDDLE_LAYER_PASSWORD = middlelayerService.middlelayer_password;

/** Intake module settings */
const intakeService = getUserProvided('intake-client-service');
vcapConstants.INTAKE_CLIENT_BASE_URL = intakeService.intake_client_base_url;

/** Login.gov settings */
const loginGovService = getUserProvided('login-service-provider');
vcapConstants.LOGIN_GOV_ISSUER = loginGovService.issuer;
vcapConstants.LOGIN_GOV_JWK = loginGovService.jwk;
vcapConstants.LOGIN_GOV_IDP_USERNAME = loginGovService.idp_username;
vcapConstants.LOGIN_GOV_IDP_PASSWORD = loginGovService.idp_password;
vcapConstants.LOGIN_GOV_BASE_URL = loginGovService.base_url;

/** USDA eAuth settings */
const eAuthService = getUserProvided('eauth-service-provider');
vcapConstants.EAUTH_USER_SAFELIST = eAuthService.whitelist;
vcapConstants.EAUTH_ISSUER = eAuthService.issuer;
vcapConstants.EAUTH_ENTRY_POINT = eAuthService.entrypoint;
vcapConstants.EAUTH_CERT = eAuthService.cert;
vcapConstants.EAUTH_PRIVATE_KEY = eAuthService.private_key;
vcapConstants.EAUTH_IDENTIFIER_FORMAT = eAuthService.identifier_format;
vcapConstants.EAUTH_DISABLE_AUTHN_CONTEXT = eAuthService.disable_authn_context;

/** SMTP settings */
const smtp = getUserProvided('smtp-service');
vcapConstants.SMTP_HOST = smtp.smtp_server;
vcapConstants.SMTP_USERNAME = smtp.username;
vcapConstants.SMTP_PASSWORD = smtp.password;
vcapConstants.SMTP_PORT = smtp.port;
vcapConstants.SPECIAL_USE_ADMIN_EMAIL_ADDRESSES = smtp.admins;
vcapConstants.SNYK_RECIPIENTS = smtp.security;

/** Pay.gov */
const payGov = getUserProvided('pay-gov');
vcapConstants.PAY_GOV_URL = payGov.url;
vcapConstants.PAY_GOV_CLIENT_URL = payGov.client_url;
vcapConstants.PAY_GOV_APP_ID = payGov.tcs_app_id;
vcapConstants.PAY_GOV_CERT = payGov.certificate;
vcapConstants.PAY_GOV_PRIVATE_KEY = payGov.private_key;

/** Database configuration */
const database = process.env.DATABASE_URL ? { url: process.env.DATABASE_URL } : getUserProvided('database');
vcapConstants.database = {
  url: database.url,
  ssl: database.ssl !== undefined ? database.ssl : process.env.NODE_ENV === 'production',
  quiet: database.quiet
};

/** New Relic */
if (vcapConstants.FEATURES.NEW_RELIC) {
  const newRelic = getUserProvided('new-relic');
  vcapConstants.NEW_RELIC_KEY = newRelic.key;
  vcapConstants.NEW_RELIC_APP_NAME = newRelic.app_name;
}

module.exports = vcapConstants;
