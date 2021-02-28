module.exports = getPayload

function getPayload (request) {
  // If request.body already exists we can stop here
  // See https://github.com/octokit/webhooks.js/pull/23
  if (request.body) {
    return Promise.resolve(request.body)
  }

  return new Promise((resolve, reject) => {
    const dataChunks = []

    request.on('error', reject)
    request.on('data', (chunk) => dataChunks.push(chunk))
    request.on('end', () => {
      const data = Buffer.concat(dataChunks).toString()
      try {
        resolve(JSON.parse(data))
      } catch (error) {
        error.message = 'Invalid JSON'
        error.status = 400
        reject(error)
      }
    })
  })
}
