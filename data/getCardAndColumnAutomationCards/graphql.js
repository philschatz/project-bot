const PROJECT_FRAGMENT = require('../project-fragment-graphql')

module.exports = `
  query getCardAndColumnAutomationCards($url: URI!) {
    resource(url: $url) {
      ... on Issue {
        projectCards(first: 10) {
          nodes {
            id
            url
            column {
              name
              id
            }
            project {
              ${PROJECT_FRAGMENT}
            }
          }
        }
      }
    }
  }
`
