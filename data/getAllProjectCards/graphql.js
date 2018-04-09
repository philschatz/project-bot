const PROJECT_FRAGMENT = require('../project-fragment-graphql')

module.exports = `
  query getAllProjectCards($issueUrl: URI!) {
    resource(url: $issueUrl) {
      ... on Issue {
        id
        repository {
          owner {
            url
            ${''/* Projects can be attached to an Organization... */}
            ... on Organization {
              projects(first: 10, states: [OPEN]) {
                nodes {
                  ${PROJECT_FRAGMENT}
                }
              }
            }
          }
          ${''/* ... or on a Repository */}
          projects(first: 10, states: [OPEN]) {
            nodes {
              ${PROJECT_FRAGMENT}
            }
          }
        }
      }
    }
  }
`
