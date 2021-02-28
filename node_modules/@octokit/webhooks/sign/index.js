module.exports = sign

const crypto = require('crypto')

function sign (secret, payload) {
  if (!secret || !payload) {
    throw new TypeError('secret & payload required')
  }

  payload = typeof payload === 'string' ? payload : toNormalizedJsonString(payload)
  return 'sha1=' + crypto.createHmac('sha1', secret).update(payload).digest('hex')
}

function toNormalizedJsonString (payload) {
  return JSON.stringify(payload).replace(/\\u[\da-f]{4}/g, s => {
    return s.substr(0, 2) + s.substr(2).toUpperCase()
  })
}
