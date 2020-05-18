const { serverless } = require('@probot/serverless-lambda')
const AWS = require('aws-sdk');
const appFn = require('./src/index')

const ssm = new AWS.SSM();
const region = process.env.AWS_REGION
AWS.config.update({region});

function getParam(name, withDecryption = false) {
  const options = {
    Name: name,
    WithDecryption: withDecryption
  };
  console.debug("Fetching param", {name});
  return ssm.getParameter(options).promise()
}

function setEnvs() {
  // https://probot.github.io/docs/configuration/
  // Map of ssm param paths to env var names
  return new Promise((resolve, reject) => {
    const varMap = {
      "GH_PRIVATE_KEY_PATH": "PRIVATE_KEY",
      "GH_WEBHOOK_SECRET_PATH": "WEBHOOK_SECRET",
      "GH_APP_ID_PATH": "APP_ID"
    }
    process.env.LOG_FORMAT = "json"
    const promises = []
    // Iterate params/env map
    for (const [paramNameEnv, envName] of Object.entries(varMap)) {
      // Get each param asynchronously, then set the appropriate env var
      const paramName = process.env[paramNameEnv];
      const paramPromise = getParam(paramName, true)
      promises.push(paramPromise.then(param => {
        console.debug(`Setting env '${envName}' from '${paramNameEnv}' found at '${paramName}'`);
        process.env[envName] = param.Parameter.Value
      }))
    }
    return Promise.all(promises).then(() => {
      console.debug("Set all envs from params successfully");
      resolve()
    }, (e) => {
      console.error("Unable to fetch params");
      console.error(e);
      reject(e)
    });
  });
}

module.exports.probot = (event, context) => new Promise(async (resolve, reject) => {
  // Custom startup, wait until required environment variables are set
  try {
    await setEnvs();
  } catch (e) {
    console.error("Unable to set required environment variables");
    return reject(e);
  }
  const handler = serverless(appFn);
  return handler(event, context);
});
