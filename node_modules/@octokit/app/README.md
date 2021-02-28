# app.js

> GitHub App Authentication client for JavaScript

[![@latest](https://img.shields.io/npm/v/@octokit/app.svg)](https://www.npmjs.com/package/@octokit/app)
[![Build Status](https://travis-ci.com/octokit/app.js.svg?branch=master)](https://travis-ci.com/octokit/app.js)
[![Greenkeeper](https://badges.greenkeeper.io/octokit/app.js.svg)](https://greenkeeper.io/)

`@octokit/app` has methods to receive tokens for a GitHub app and its installations. The tokens can then be used to interact with GitHub’s [REST API](https://developer.github.com/v3/) or [GraphQL API](https://developer.github.com/v4/). Note that `@octokit/app` does not have methods to send any requests, you will need to use your own request library such as [`@octokit/request`](https://github.com/octokit/request). Alternatively you can use the [`octokit`](https://github.com/octokit/octokit.js) package which comes with everything you need to integrate with any of GitHub’s APIs.

## Usage

<table>
<tbody valign=top align=left>
<tr><th>
Browsers
</th><td width=100%>
Load <code>@octokit/app</code> directly from <a href="https://unpkg.com">unpkg.com</a>
        
```html
<script type="module">
import { App } from "https://unpkg.com/@octokit/app";
</script>
```

</td></tr>
<tr><th>
Node
</th><td>

Install with <code>npm install @octokit/app</code>

```js
const { App } = require("@octokit/app");
// or: import { App } from "@octokit/app";
```

</td></tr>
</tbody>
</table>

## Authenticating as an App

In order to authenticate as a GitHub App, you need to generate a Private Key and use it to sign a JSON Web Token (jwt) and encode it. See also the [GitHub Developer Docs](https://developer.github.com/apps/building-github-apps/authenticating-with-github-apps/).

```js
const { App } = require("@octokit/app");
const { request } = require("@octokit/request");

const APP_ID = 1; // replace with your app ID
const PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\n..."; // replace with contents of your private key. Replace line breaks with \n

const app = new App({ id: APP_ID, privateKey: PRIVATE_KEY });
const jwt = app.getSignedJsonWebToken();

// Example of using authenticated app to GET an individual installation
// https://developer.github.com/v3/apps/#find-repository-installation
const { data } = await request("GET /repos/:owner/:repo/installation", {
  owner: "hiimbex",
  repo: "testing-things",
  headers: {
    authorization: `Bearer ${jwt}`,
    accept: "application/vnd.github.machine-man-preview+json"
  }
});

// contains the installation id necessary to authenticate as an installation
const installationId = data.id;
```

## Authenticating as an Installation

Once you have authenticated as a GitHub App, you can use that in order to request an installation access token. Calling `requestToken()` automatically performs the app authentication for you. See also the [GitHub Developer Docs](https://developer.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-an-installation).

```js
const { App } = require("@octokit/app");
const { request } = require("@octokit/request");

const APP_ID = 1; // replace with your app ID
const PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\n..."; // replace with contents of your private key. Replace line breaks with \n

const app = new App({ id: APP_ID, privateKey: PRIVATE_KEY });
const installationAccessToken = await app.getInstallationAccessToken({
  installationId
});

// https://developer.github.com/v3/issues/#create-an-issue
await request("POST /repos/:owner/:repo/issues", {
  owner: "hiimbex",
  repo: "testing-things",
  headers: {
    authorization: `token ${installationAccessToken}`,
    accept: "application/vnd.github.machine-man-preview+json"
  },
  title: "My installation’s first issue"
});
```

## Caching installation tokens

Installation tokens expire after an hour. By default, each `App` instance is caching up to 15000 tokens simultaneously using [`lru-cache`](https://github.com/isaacs/node-lru-cache). You can pass your own cache implementation by passing `options.cache.{get,set}` to the constructor.

```js
const { App } = require("@octokit/app");
const APP_ID = 1;
const PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\n...";

const CACHE = {};

const app = new App({
  id: APP_ID,
  privateKey: PRIVATE_KEY,
  cache: {
    get(key) {
      return CACHE[key];
    },
    set(key, value) {
      CACHE[key] = value;
    }
  }
});
```

## Using with GitHub Enterprise

The `baseUrl` option can be used to override default GitHub's `https://api.github.com`:

```js
const app = new App({
  id: APP_ID,
  privateKey: PRIVATE_KEY,
  baseUrl: "https://github-enterprise.com/api/v3"
});
```

## License

[MIT](LICENSE)
