// rules: { assigned_issue: true, new_pullrequest: ['repo1', 'repo2']}
const buildCard = (rules) => {
  let m = new Map()
  for (const key of Object.keys(rules)) {
    m.set(key, rules[key])
  }

  function buildEntry (ary) {
    const [key, value] = ary
    if (value === true) {
      return `- \`${key}\``
    } else if (Array.isArray(value)) {
      return `- \`${key}\` ${value.map(v => `**${v}**`).join(' ')}`
    } else {
      throw new Error(`BUG: value not supported: ${JSON.toString(value)}`)
    }
  }

  return `###### Automation Rules

  <!-- Documentation: https://github.com/philschatz/project-bot -->
  
  ${[...m.entries()].map(buildEntry).join('\n')}
`
}
const buildProject = (name, cardsInColumns) => {
  let id = 1
  const freshId = () => {
    id += 1
    return `autoid-${id}`
  }

  return {
    name,
    id: freshId(),
    columns: {
      nodes: cardsInColumns.map((columnCards) => {
        const id = freshId()
        let cards = columnCards.map((note) => {
          const id = freshId()
          return {
            id,
            url: `card-url-${id}`,
            note
          }
        })
        return {
          id,
          url: `column-url-${id}`,
          firstCards: {
            totalCount: cards.length,
            nodes: cards
          },
          lastCards: {
            totalCount: cards.length,
            nodes: cards
          }
        }
      })
    }
  }
}

const buildRepoGraphQLResponseNew = (repoName, cards) => {
  return {
    resource: {
      repository: {
        owner: {},
        projects: {
          nodes: [buildProject(`project-${repoName}`, cards)]
        }
      }
    }
  }
}

const buildOrgGraphQLResponseNew = (repoName, cards) => {
  return {
    resource: {
      repository: {
        owner: {
          projects: {
            nodes: [buildProject(`project-${repoName}`, cards)]
          }
        }
      }
    }
  }
}

// query getCardAndColumnAutomationCards($url: URI!) {
//   resource(url: $url) {
//     ... on Issue {
//       projectCards(first: 10) {
//         nodes {
//           id
//           url
//           column {
//             name
//             id
//           }
//           project {
//             ${PROJECT_FRAGMENT}
//           }
//         }
//       }
//     }
//   }
// }
const buildGraphQLResponse = (repoName, automationCards) => {
  return {
    resource: {
      projectCards: {
        nodes: [
          {
            id: 'card-id',
            url: 'card-url',
            column: {
              name: 'column-name',
              id: 'column-id'
            },
            project: buildProject(`project-${repoName}`, automationCards)
          }
        ]
      }
    }
  }
}

module.exports = {
  buildCard,
  buildGraphQLResponse,
  buildRepoGraphQLResponseNew,
  buildOrgGraphQLResponseNew
}
