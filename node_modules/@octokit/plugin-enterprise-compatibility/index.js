module.exports = octokitEnterpriseCompatibility

function octokitEnterpriseCompatibility (octokit) {
  // see https://github.com/octokit/rest.js/blob/15.x/lib/routes.json#L3046-L3068
  const addOrReplaceLabelsOptions = {
    params: {
      issue_number: {
        required: true,
        type: 'integer'
      },
      labels: {
        required: true,
        type: 'string[]',
        mapTo: 'data'
      },
      number: {
        alias: 'issue_number',
        deprecated: true,
        type: 'integer'
      },
      owner: {
        required: true,
        type: 'string'
      },
      repo: {
        required: true,
        type: 'string'
      }
    },
    url: '/repos/:owner/:repo/issues/:issue_number/labels'
  }

  octokit.registerEndpoints({
    issues: {
      addLabels: Object.assign({ method: 'POST' }, addOrReplaceLabelsOptions),
      replaceLabels: Object.assign({ method: 'PUT' }, addOrReplaceLabelsOptions)
    }
  })
}
