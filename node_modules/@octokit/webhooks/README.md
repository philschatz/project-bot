# @octokit/webhooks

> GitHub webhook events toolset for Node.js

[![Build Status](https://travis-ci.org/octokit/webhooks.js.svg?branch=master)](https://travis-ci.org/octokit/webhooks.js)
[![Coverage Status](https://coveralls.io/repos/octokit/webhooks.js/badge.svg?branch=master)](https://coveralls.io/github/octokit/webhooks.js?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/octokit/webhooks.js.svg)](https://greenkeeper.io/)

[GitHub webhooks](https://developer.github.com/webhooks/) can be registered in multiple ways

1. In repository or organization settings on [github.com](https://github.com/).
2. Using the REST API for [repositories](https://developer.github.com/v3/repos/hooks/) or [organizations](https://developer.github.com/v3/orgs/hooks/)
3. By installing a [GitHub App](https://developer.github.com/apps/).

`@octokit/webhooks` helps to handle webhook events received from GitHub.

Note that while setting a secret is optional on GitHub, it is required to be set in order to use `@octokit/webhooks`. Content Type must be set to `application/json`, `application/x-www-form-urlencoded` is not supported.

## Example

```js
// install with: npm install @octokit/webhooks
const WebhooksApi = require('@octokit/webhooks')
const webhooks = new WebhooksApi({
  secret: 'mysecret'
})

webhooks.on('*', ({id, name, payload}) => {
  console.log(name, 'event received')
})

require('http').createServer(webhooks.middleware).listen(3000)
// can now receive webhook events at port 3000
```

## Local development

You can receive webhooks on your local machine or even browser using [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) and [smee.io](https://smee.io/).

Go to [smee.io](https://smee.io/) and <kbd>Start a new channel</kbd>. Then copy the "Webhook Proxy URL" and

1. enter it in the GitHub App’s "Webhook URL" input
2. pass it to the [EventSource](https://github.com/EventSource/eventsource) constructor, see below

```js
const webhookProxyUrl = 'https://smee.io/IrqK0nopGAOc847' // replace with your own Webhook Proxy URL
const source = new EventSource(webhookProxyUrl)
source.onmessage = (event) => {
  const webhookEvent = JSON.parse(event.data)
  webhooks.verifyAndReceive({
    id: webhookEvent['x-request-id'],
    name: webhookEvent['x-github-event'],
    signature: webhookEvent['x-hub-signature'],
    payload: webhookEvent.body
  }).catch(console.error)
}
```

`EventSource` is a native browser API and can be polyfilled for browsers that don’t support it. In node, you can use the [`eventsource`](https://github.com/EventSource/eventsource) package: install with `npm install eventsource`, then `const EventSource = require('eventsource')`

## API

1. [Constructor](#constructor)
2. [webhooks.sign()](#webhookssign)
3. [webhooks.verify()](#webhooksverify)
4. [webhooks.verifyAndReceive()](#webhooksverifyandreceive)
4. [webhooks.receive()](#webhooksreceive)
5. [webhooks.on()](#webhookson)
6. [webhooks.removeListener()](#webhooksremoveListener)
7. [webhooks.middleware()](#webhooksmiddleware)
8. [Webhook events](#webhook-events)
9. [Special events](#special-events)
   1. [`*` wildcard event](#-wildcard-event)
   1. [`error` event](#error-event)

### Constructor

```js
new WebhooksApi({secret[, path]})
```

<table width="100%">
  <tr>
    <td>
      <code>
        secret
      </code>
      <em>(String)</em>
    </td>
    <td>
      <strong>Required.</strong>
      Secret as configured in GitHub Settings.
    </td>
  </tr>
  <tr>
    <td>
      <code>
        transform
      </code>
      <em>(Function)</em>
    </td>
    <td>
      Only relevant for <a href="#webhookson"><code>webhooks.on</code></a>.
      Transform emitted event before calling handlers. Can be asynchronous.
    </td>
  </tr>
  <tr>
    <td>
      <code>
        path
      </code>
      <em>(String)</em>
    </td>
    <td>
      Only relevant for <a href="#webhooksmiddleware"><code>webhooks.middleware</code></a>.
      Custom path to match requests against. Defaults to <code>/</code>.
    </td>
  </tr>
</table>

Returns the `webhooks` API.

### webhooks.sign()

```js
webhooks.sign(eventPayload)
```

<table width="100%">
  <tr>
    <td>
      <code>
        eventPayload
      </code>
      <em>
        (Object)
      </em>
    </td>
    <td>
      <strong>Required.</strong>
      Webhook request payload as received from GitHub
    </td>
  </tr>
</table>

Returns a `signature` string. Throws error if `eventPayload` is not passed.

Can also be used [standalone](sign/).

### webhooks.verify()

```js
webhooks.verify(eventPayload, signature)
```

<table width="100%">
  <tr>
    <td>
      <code>
        eventPayload
      </code>
      <em>
        (Object)
      </em>
    </td>
    <td>
      <strong>Required.</strong>
      Webhook event request payload as received from GitHub.
    </td>
  </tr>
  <tr>
    <td>
      <code>
        signature
      </code>
      <em>
        (String)
      </em>
    </td>
    <td>
      <strong>Required.</strong>
      Signature string as calculated by <code><a href="#webhookssign">webhooks.sign()</a></code>.
    </td>
  </tr>
</table>

Returns `true` or `false`. Throws error if `eventPayload` or `signature` not passed.

Can also be used [standalone](verify/).

### webhooks.verifyAndReceive()

```js
webhooks.verifyAndReceive({id, name, payload, signature})
```

<table width="100%">
  <tr>
    <td>
      <code>
        id
      </code>
      <em>
        String
      </em>
    </td>
    <td>
      Unique webhook event request id
    </td>
  </tr>
  <tr>
    <td>
      <code>
        name
      </code>
      <em>
        String
      </em>
    </td>
    <td>
      <strong>Required.</strong>
      Name of the event. (Event names are set as <a href="https://developer.github.com/webhooks/#delivery-headers"><code>X-GitHub-Event</code> header</a>
      in the webhook event request.)
    </td>
  </tr>
  <tr>
    <td>
      <code>
        payload
      </code>
      <em>
        Object
      </em>
    </td>
    <td>
      <strong>Required.</strong>
      Webhook event request payload as received from GitHub.
    </td>
  </tr>
  <tr>
    <td>
      <code>
        signature
      </code>
      <em>
        (String)
      </em>
    </td>
    <td>
      <strong>Required.</strong>
      Signature string as calculated by <code><a href="#webhookssign">webhooks.sign()</a></code>.
    </td>
  </tr>
</table>

Returns a promise.

Verifies event using [webhooks.verify()](#webhooksverify), then handles the event using [webhooks.receive()](#webhooksreceive).

Additionally, if verification fails, rejects return promise and emits an `error` event.

Example

```js
const WebhooksApi = require('@octokit/webhooks')
const webhooks = new WebhooksApi({
  secret: 'mysecret'
})
eventHandler.on('error', handleSignatureVerificationError)

// put this inside your webhooks route handler
eventHandler.verifyAndReceive({
  id: request.headers['x-github-delivery'],
  name: request.headers['x-github-event'],
  payload: request.body,
  signature: request.headers['x-hub-signature']
}).catch(handleErrorsFromHooks)
```

### webhooks.receive()

```js
webhooks.receive({id, name, payload})
```

<table width="100%">
  <tr>
    <td>
      <code>
        id
      </code>
      <em>
        String
      </em>
    </td>
    <td>
      Unique webhook event request id
    </td>
  </tr>
  <tr>
    <td>
      <code>
        name
      </code>
      <em>
        String
      </em>
    </td>
    <td>
      <strong>Required.</strong>
      Name of the event. (Event names are set as <a href="https://developer.github.com/webhooks/#delivery-headers"><code>X-GitHub-Event</code> header</a>
      in the webhook event request.)
    </td>
  </tr>
  <tr>
    <td>
      <code>
        payload
      </code>
      <em>
        Object
      </em>
    </td>
    <td>
      <strong>Required.</strong>
      Webhook event request payload as received from GitHub.
    </td>
  </tr>
</table>

Returns a promise. Runs all handlers set with [`webhooks.on()`](#webhookson) in parallel and waits for them to finish. If one of the handlers rejects or throws an error, then `webhooks.receive()` rejects. The returned error has an `.errors` property which holds an array of all errors caught from the handlers. If no errors occur, `webhooks.receive()` resolves without passing any value.

The `.receive()` method belongs to the [receiver](receiver/) module which can be used standalone.

### webhooks.on()

```js
webhooks.on(eventName, handler)
webhooks.on(eventNames, handler)
```

<table width="100%">
  <tr>
    <td>
      <code>
        eventName
      </code>
      <em>
        String
      </em>
    </td>
    <td>
      <strong>Required.</strong>
      Name of the event. One of <a href="#listofalleventnames">GitHub’s supported event names</a>.
    </td>
  </tr>
  <tr>
    <td>
      <code>
        eventNames
      </code>
      <em>
        Array
      </em>
    </td>
    <td>
      <strong>Required.</strong>
      Array of event names.
    </td>
  </tr>
  <tr>
    <td>
      <code>
        handler
      </code>
      <em>
        Function
      </em>
    </td>
    <td>
      <strong>Required.</strong>
      Method to be run each time the event with the passed name is received.
      the <code>handler</code> function can be an async function, throw an error or
      return a Promise. The handler is called with an event object: <code>{id, name, payload}</code>.
    </td>
  </tr>
</table>

The `.on()` method belongs to the [receiver](receiver/) module which can be used standalone.

### webhooks.removeListener()

```js
webhooks.removeListener(eventName, handler)
webhooks.removeListener(eventNames, handler)
```

<table width="100%">
  <tr>
    <td>
      <code>
        eventName
      </code>
      <em>
        String
      </em>
    </td>
    <td>
      <strong>Required.</strong>
      Name of the event. One of <a href="#listofalleventnames">GitHub’s supported event names</a>.
    </td>
  </tr>
  <tr>
    <td>
      <code>
        eventNames
      </code>
      <em>
        Array
      </em>
    </td>
    <td>
      <strong>Required.</strong>
      Array of event names.
    </td>
  </tr>
  <tr>
    <td>
      <code>
        handler
      </code>
      <em>
        Function
      </em>
    </td>
    <td>
      <strong>Required.</strong>
      Method which was previously passed to <code><a href="webhookson">webhooks.on()</a></code>. If the same handler was registered multiple times for the same event, only the most recent handler gets removed.
    </td>
  </tr>
</table>

The `.removeListener()` method belongs to the [receiver](receiver/) module which can be used standalone.

### webhooks.middleware()

```js
webhooks.middleware(request, response[, next])
```

<table width="100%">
  <tr>
    <td>
      <code>
        request
      </code>
      <em>
        Object
      </em>
    </td>
    <td>
      <strong>Required.</strong>
      A Node.js <a href="https://nodejs.org/docs/latest/api/http.html#http_class_http_clientrequest">http.ClientRequest</a>.
    </td>
  </tr>
  <tr>
    <td>
      <code>
        response
      </code>
      <em>
        Object
      </em>
    </td>
    <td>
      <strong>Required.</strong>
      A Node.js <a href="https://nodejs.org/docs/latest/api/http.html#http_class_http_serverresponse">http.ServerResponse</a>.
    </td>
  </tr>
  <tr>
    <td>
      <code>
        next
      </code>
      <em>
        Function
      </em>
    </td>
    <td>
      Optional function which invokes the next middleware, as used by <a href="https://github.com/senchalabs/connect">Connect</a> and <a href="http://expressjs.com/">Express</a>.
    </td>
  </tr>
</table>

Returns a `requestListener` (or _middleware_) method which can be directly passed to [`http.createServer()`](https://nodejs.org/docs/latest/api/http.html#http_http_createserver_requestlistener), <a href="http://expressjs.com/">Express</a> and other compatible Node.js server frameworks.

Can also be used [standalone](middleware/).

### Webhook events

See the full list of [event types with example payloads](https://developer.github.com/v3/activity/events/types/).

If there are actions for a webhook, events are emitted for both, the webhook name as well as a combination of the webhook name and the action, e.g. `installation` and `installation.created`.

<!-- autogenerated via scripts/update-known-events.js --><table ><thead><tr><th class="name-th">Event</th><th class="actions-th">Actions</th></tr></thead><tbody ><tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#checkrunevent"><code>check_run</code></a></td><td class="actions-td td_text"><code>completed</code><br><code>created</code><br><code>requested_action</code><br><code>rerequested</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#checksuiteevent"><code>check_suite</code></a></td><td class="actions-td td_text"><code>completed</code><br><code>requested</code><br><code>rerequested</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#commitcommentevent"><code>commit_comment</code></a></td><td class="actions-td td_text"><code>created</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#contentreferenceevent"><code>content_reference</code></a></td><td class="actions-td td_num"></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#createevent"><code>create</code></a></td><td class="actions-td td_num"></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#deleteevent"><code>delete</code></a></td><td class="actions-td td_num"></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#deploykeyevent"><code>deploy_key</code></a></td><td class="actions-td td_text"><code>created</code><br><code>deleted</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#deploymentevent"><code>deployment</code></a></td><td class="actions-td td_num"></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#deploymentstatusevent"><code>deployment_status</code></a></td><td class="actions-td td_num"></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#forkevent"><code>fork</code></a></td><td class="actions-td td_num"></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#githubappauthorizationevent"><code>github_app_authorization</code></a></td><td class="actions-td td_num"></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#gollumevent"><code>gollum</code></a></td><td class="actions-td td_num"></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#installationevent"><code>installation</code></a></td><td class="actions-td td_text"><code>created</code><br><code>deleted</code><br><code>new_permissions_accepted</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#installationrepositoriesevent"><code>installation_repositories</code></a></td><td class="actions-td td_text"><code>added</code><br><code>removed</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#issuecommentevent"><code>issue_comment</code></a></td><td class="actions-td td_text"><code>created</code><br><code>deleted</code><br><code>edited</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#issuesevent"><code>issues</code></a></td><td class="actions-td td_text"><code>assigned</code><br><code>closed</code><br><code>deleted</code><br><code>demilestoned</code><br><code>edited</code><br><code>labeled</code><br><code>locked</code><br><code>milestoned</code><br><code>opened</code><br><code>pinned</code><br><code>reopened</code><br><code>transferred</code><br><code>unassigned</code><br><code>unlabeled</code><br><code>unlocked</code><br><code>unpinned</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#labelevent"><code>label</code></a></td><td class="actions-td td_text"><code>created</code><br><code>deleted</code><br><code>edited</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#marketplacepurchaseevent"><code>marketplace_purchase</code></a></td><td class="actions-td td_text"><code>cancelled</code><br><code>changed</code><br><code>pending_change</code><br><code>pending_change_cancelled</code><br><code>purchased</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#memberevent"><code>member</code></a></td><td class="actions-td td_text"><code>added</code><br><code>deleted</code><br><code>edited</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#membershipevent"><code>membership</code></a></td><td class="actions-td td_text"><code>added</code><br><code>removed</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#metaevent"><code>meta</code></a></td><td class="actions-td td_text"><code>deleted</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#milestoneevent"><code>milestone</code></a></td><td class="actions-td td_text"><code>closed</code><br><code>created</code><br><code>deleted</code><br><code>edited</code><br><code>opened</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#organizationevent"><code>organization</code></a></td><td class="actions-td td_text"><code>deleted</code><br><code>member_added</code><br><code>member_invited</code><br><code>member_removed</code><br><code>renamed</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#orgblockevent"><code>org_block</code></a></td><td class="actions-td td_text"><code>blocked</code><br><code>unblocked</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#pagebuildevent"><code>page_build</code></a></td><td class="actions-td td_num"></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#projectcardevent"><code>project_card</code></a></td><td class="actions-td td_text"><code>converted</code><br><code>created</code><br><code>deleted</code><br><code>edited</code><br><code>moved</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#projectcolumnevent"><code>project_column</code></a></td><td class="actions-td td_text"><code>created</code><br><code>deleted</code><br><code>edited</code><br><code>moved</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#projectevent"><code>project</code></a></td><td class="actions-td td_text"><code>closed</code><br><code>created</code><br><code>deleted</code><br><code>edited</code><br><code>reopened</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#publicevent"><code>public</code></a></td><td class="actions-td td_num"></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#pullrequestevent"><code>pull_request</code></a></td><td class="actions-td td_text"><code>assigned</code><br><code>closed</code><br><code>edited</code><br><code>labeled</code><br><code>locked</code><br><code>opened</code><br><code>ready_for_review</code><br><code>reopened</code><br><code>review_request_removed</code><br><code>review_requested</code><br><code>unassigned</code><br><code>unlabeled</code><br><code>unlocked</code><br><code>synchronize</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#pullrequestreviewevent"><code>pull_request_review</code></a></td><td class="actions-td td_text"><code>dismissed</code><br><code>edited</code><br><code>submitted</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#pullrequestreviewcommentevent"><code>pull_request_review_comment</code></a></td><td class="actions-td td_text"><code>created</code><br><code>deleted</code><br><code>edited</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#pushevent"><code>push</code></a></td><td class="actions-td td_num"></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#registrypackageevent"><code>registry_package</code></a></td><td class="actions-td td_text"><code>published</code><br><code>updated</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#releaseevent"><code>release</code></a></td><td class="actions-td td_text"><code>created</code><br><code>deleted</code><br><code>edited</code><br><code>prereleased</code><br><code>published</code><br><code>unpublished</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#repositoryevent"><code>repository</code></a></td><td class="actions-td td_text"><code>archived</code><br><code>created</code><br><code>deleted</code><br><code>edited</code><br><code>privatized</code><br><code>publicized</code><br><code>renamed</code><br><code>transferred</code><br><code>unarchived</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#repositoryimportevent"><code>repository_import</code></a></td><td class="actions-td td_num"></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#repositoryvulnerabilityalertevent"><code>repository_vulnerability_alert</code></a></td><td class="actions-td td_text"><code>create</code><br><code>dismiss</code><br><code>resolve</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#securityadvisoryevent"><code>security_advisory</code></a></td><td class="actions-td td_text"><code>performed</code><br><code>published</code><br><code>updated</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#starevent"><code>star</code></a></td><td class="actions-td td_text"><code>created</code><br><code>deleted</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#statusevent"><code>status</code></a></td><td class="actions-td td_num"></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#teamevent"><code>team</code></a></td><td class="actions-td td_text"><code>added_to_repository</code><br><code>created</code><br><code>deleted</code><br><code>edited</code><br><code>removed_from_repository</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#teamaddevent"><code>team_add</code></a></td><td class="actions-td td_num"></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#watchevent"><code>watch</code></a></td><td class="actions-td td_text"><code>started</code></td></tr>
<tr ><td class="name-td td_text"><a href="https://developer.github.com/v3/activity/events/types/#pingevent"><code>ping</code></a></td><td class="actions-td td_num"></td></tr></tbody></table><!-- /autogenerated via scripts/update-known-events.js -->

### Special events

Besides the webhook events, there are [special events](#specialevents) emitted by `@octokit/webhooks`.

#### `*` wildcard event

The `*` event is emitted for all webhook events [listed above](#listofwebhookevents).

```js
webhooks.on('*', (event) => {
  console.log(`"${event.name}" event received"`)
})
```

#### `error` event

If a webhook event handler throws an error or returns a promise that rejects, an `error` event is triggered. You can subscribe to this event for logging or reporting events. The passed `error` object has a `.event` property which has all information on the event:

- `id`: The unique webhook event request id
- `name`: The name of the event
- `payload`: The event request payload

```js
webhooks.on('error', (error) => {
  console.log(`Error occured in "${error.event.name} handler: ${error.stack}"`)
})
```

Asynchronous `error` event handler are not blocking the `.receive()` method from completing.

## License

[MIT](LICENSE.md)
