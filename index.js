const commonmark = require('commonmark')

const commonmarkParser = new commonmark.Parser()

function ALWAYS_TRUE () { return true }

const AUTOMATION_COMMANDS = [
  { ruleName: 'edited_issue', webhookName: 'issues.edited', ruleMatcher: ALWAYS_TRUE },
  { ruleName: 'demilestoned_issue', webhookName: 'issues.demilestoned', ruleMatcher: ALWAYS_TRUE },
  { ruleName: 'milestoned_issue', webhookName: 'issues.milestoned', ruleMatcher: ALWAYS_TRUE },
  { ruleName: 'reopened_pullrequest', webhookName: 'pull_request.reopened', ruleMatcher: ALWAYS_TRUE },
  { ruleName: 'reopened_issue', webhookName: 'issues.reopened', ruleMatcher: ALWAYS_TRUE },
  { ruleName: 'closed_issue', webhookName: 'issues.closed', ruleMatcher: ALWAYS_TRUE },
  { ruleName: 'added_reviewer', webhookName: 'pull_request.review_requested', ruleMatcher: ALWAYS_TRUE }, // See https://developer.github.com/v3/activity/events/types/#pullrequestevent to get the reviewer
  {
    createsACard: true,
    ruleName: 'new_issue',
    webhookName: 'issues.opened',
    ruleMatcher: async function (logger, context, ruleArgs) {
      if (ruleArgs.length > 0) {
        // Verify that it matches one of the repositories listed
        const repoNames = ruleArgs
        return repoNames.indexOf(context.payload.repository.name) >= 0
      } else {
        return true
      }
    }
  },
  {
    createsACard: true,
    ruleName: 'new_pullrequest',
    webhookName: 'pull_request.opened',
    ruleMatcher: async function (logger, context, ruleArgs) {
      if (ruleArgs.length > 0) {
        // Verify that it matches one of the repositories listed
        const repoNames = ruleArgs

        return repoNames.indexOf(context.payload.repository.name) >= 0
      } else {
        return true
      }
    }
  },
  {
    ruleName: 'merged_pullrequest',
    webhookName: 'pull_request.closed',
    ruleMatcher: async function (logger, context, ruleArgs) {
      // see https://developer.github.com/v3/activity/events/types/#pullrequestevent
      return !!context.payload.pull_request.merged
    }
  },
  {
    ruleName: 'closed_pullrequest',
    webhookName: 'pull_request.closed',
    ruleMatcher: async function (logger, context, ruleArgs) {
      // see https://developer.github.com/v3/activity/events/types/#pullrequestevent
      return !context.payload.pull_request.merged
    }
  },
  {
    ruleName: 'assigned_to_issue',
    webhookName: 'issues.assigned',
    ruleMatcher: async function (logger, context, ruleArgs) {
      if (ruleArgs[0] !== true) {
        return context.payload.assignee.login === ruleArgs[0]
      } else {
        logger.error(`assigned_to.issue requires a username but it is missing`)
      }
    }
  },
  {
    ruleName: 'assigned_issue',
    webhookName: 'issues.assigned',
    ruleMatcher: async function (logger, context, ruleArgs) {
      return context.payload.issue.assignees.length === 1
    }
  },
  {
    ruleName: 'unassigned_issue',
    webhookName: 'issues.unassigned',
    ruleMatcher: async function (logger, context, ruleArgs) {
      return context.payload.issue.assignees.length === 0
    }
  },
  {
    ruleName: 'assigned_pullrequest',
    webhookName: 'pull_request.assigned',
    ruleMatcher: async function (logger, context, ruleArgs) {
      return context.payload.pull_request.assignees.length === 1
    }
  },
  {
    ruleName: 'unassigned_pullrequest',
    webhookName: 'pull_request.unassigned',
    ruleMatcher: async function (logger, context, ruleArgs) {
      return context.payload.pull_request.assignees.length === 0
    }
  },
  {
    ruleName: 'added_label',
    webhookName: 'issues.labeled',
    ruleMatcher: async function (logger, context, ruleArgs) {
      // labels may be defined by a label or an id (for more persistence)
      return context.payload.label.name === ruleArgs[0] || context.payload.label.id === ruleArgs[0]
    }
  },
  {
    ruleName: 'removed_label',
    webhookName: 'issues.unlabeled',
    ruleMatcher: async function (logger, context, ruleArgs) {
      return context.payload.label.name === ruleArgs[0] || context.payload.label.id === ruleArgs[0]
    }
  },
  {
    ruleName: 'accepted_pullrequest',
    webhookName: 'pull_request_review.submitted',
    ruleMatcher: async function (logger, context, ruleArgs) {
      // See https://developer.github.com/v3/activity/events/types/#pullrequestreviewevent
      // Check if there are any Pending or Rejected reviews and ensure there is at least one Accepted one
      const {data: reviews} = await context.github.pullRequests.getReviews(context.issue())
      // Check that there is at least one Accepted
      const hasAccepted = reviews.filter((review) => review.state === 'APPROVED').length >= 1
      const hasRejections = reviews.filter((review) => review.state === 'REQUEST_CHANGES').length >= 1
      const hasPending = reviews.filter((review) => review.state === 'PENDING').length >= 1
      if (hasAccepted && !hasRejections && !hasPending) {
        return true
      } else {
        return false
      }
    }
  }
]

module.exports = (robot) => {
  const logger = robot.log.child({name: 'project-bot'})
  robot.events.setMaxListeners(Math.max(robot.events.getMaxListeners(), 20)) // Since we register at least 19 listeners
  logger.info(`Starting up`)

  const AUTOMATION_CARDS = {} // Derived from parsing the *magic* "Automation Rules" cards. Key is "{projectId}" and value is [{columnId, ruleName, ruleArgs}]

  function parseMarkdown (card) {
    if (!card.note) {
      return new Map() // no Rules
    }
    const root = commonmarkParser.parse(card.note)
    const walker = root.walker()
    const parsedRules = new Map()
    let walkEvent
    let hasMagicTitle = false
    while ((walkEvent = walker.next())) {
      const {node} = walkEvent
      if (walkEvent.entering && node.type === 'text' && node.parent.type === 'heading' && node.literal.trim() === 'Automation Rules') {
        logger.debug(`Card Does have the Magic "Automation Rules" text`)
        hasMagicTitle = true
      }
      // Each item should be simple text that contains the rule, followed by a space, followed by any arguments (sometimes wrapped in spaces)
      if (hasMagicTitle && walkEvent.entering && node.type === 'code') {
        logger.debug(`Found a code block in the Card (looks promising...)`)
        if (node.parent.type === 'paragraph' && node.parent.parent.type === 'item') {
          let args = []
          let argsNode = node
          while ((argsNode = argsNode.next)) {
            if (argsNode.type === 'strong' || argsNode.type === 'emph') {
              if (argsNode.firstChild.type === 'text') {
                args.push(argsNode.firstChild.literal.trim())
              }
            }
          }
          // Try splitting up the text (backwards-compatibility)
          if (args.length === 0 && node.next && node.next.literal) {
            args = node.next.literal.trim().split(' ').map((arg) => arg.trim())
          }

          logger.info(`Detected Automation Rule: ${node.literal} with args=${JSON.stringify(args)} on Card ${card.url}`)
          parsedRules.set(node.literal, args)
        }
      }
    }
    return parsedRules
  }

  // Register all of the automation commands
  AUTOMATION_COMMANDS.forEach(({createsACard, webhookName, ruleName, ruleMatcher}) => {
    logger.trace(`Attaching listener for ${webhookName}`)
    robot.on(webhookName, async function (context) {
      let issueUrl
      let issueId
      let issueType
      logger.trace(`Event received for ${webhookName}`)
      if (context.payload.issue) {
        issueUrl = context.payload.issue.url
        issueId = context.payload.issue.id
        issueType = 'Issue'
      } else {
        issueUrl = context.payload.pull_request.issue_url
        issueId = context.payload.pull_request.id
        issueType = 'PullRequest'
      }

      if (createsACard) {
        // Loop through all of the Automation Cards and see if any match
        // query getAllProjectCards($issueUrl: URI!) {
        //   resource(url: $issueUrl) {
        //     ... on Issue {
        //       repository {
        //         owner {
        //           url
        //           ... on Organization {
        //             projects(first: 10, states: [OPEN]) {
        //               nodes {
        //                 columns(first: 10) {
        //                   nodes {
        //                     id
        //                     firstCards: cards(first: 1) {
        //                       nodes {
        //                         id
        //                         note
        //                       }
        //                     }
        //                     lastCards: cards(first: 1) {
        //                       nodes {
        //                         id
        //                         note
        //                       }
        //                     }
        //                   }
        //                 }
        //               }
        //             }
        //           }
        //         }
        //         projects(first: 10, states: [OPEN]) {
        //           nodes {
        //             columns(first: 10) {
        //               nodes {
        //                 firstCards: cards(first: 1) {
        //                   nodes {
        //                     id
        //                     note
        //                   }
        //                 }
        //                 lastCards: cards(first: 1) {
        //                   nodes {
        //                     id
        //                     note
        //                   }
        //                 }
        //               }
        //             }
        //           }
        //         }
        //       }
        //     }
        //   }
        // }

        Object.entries(AUTOMATION_CARDS).forEach(async ([projectId, cardInfos]) => {
          cardInfos.forEach(async ({ruleName: rn, columnId, ruleArgs, ownerUrl}) => {
            // Check if the AUTOMATION_CARD's owner matches this Issue's owner
            // Org Projects have a api.github.com/orgs/{org_name} format
            // while a Repository has an api.github.com/users/{org_name} format
            // so we need to look at a different field to see if they match.
            if (context.payload.organization) {
              if (!ownerUrl === context.payload.organization.url) {
                return
              }
            } else {
              if (!ownerUrl === context.payload.repository.owner.url) {
                return
              }
            }
            if (ruleName === rn) {
              if (await ruleMatcher(logger, context, ruleArgs)) {
                // Create a new Card
                logger.info(`Creating new Card for "${issueUrl}" because of "${ruleName}" and value: "${ruleArgs}"`)
                await context.github.projects.createProjectCard({column_id: columnId, content_id: issueId, content_type: issueType})
              }
            }
          })
        })
      } else {
        // Check if we need to move the Issue (or Pull request)
        const {data, errors} = await context.github.query(`
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
                      name
                      id
                      columns(first: 10) {
                        totalCount
                        nodes {
                          id
                          url
                          firstCard: cards(first: 1) {
                            totalCount
                            nodes {
                              url
                              id
                              note
                            }
                          }
                          lastCard: cards(last: 1) {
                            totalCount
                            nodes {
                              url
                              id
                              note
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `, {url: issueUrl})
        if (errors) {
          return logger.error(errors)
        }
        const cardsForIssue = data.resource.projectCard.nodes

        for (const issueCard of cardsForIssue) {
          const automationRules = []
          issueCard.project.columns.nodes.forEach((column) => {
            if (column.id === issueCard.column.id) {
              return // Skip because the Card is already in the Column
            }
            let cardsToParse = []
            if (column.firstCard) { cardsToParse = cardsToParse.concat(column.firstCard.nodes) }
            if (column.lastCard) { cardsToParse = cardsToParse.concat(column.lastCard.nodes) }

            cardsToParse.forEach((card) => {
              const rules = parseMarkdown(card)
              if (rules.get(ruleName)) {
                automationRules.push({
                  column: column,
                  ruleArgs: rules.get(ruleName)
                })
              }
            })
          })

          for (const {column, ruleArgs} of automationRules) {
            if (await ruleMatcher(logger, context, ruleArgs)) {
              logger.info(`Moving Card ${issueCard.id} for "${issueUrl}" to column ${column.id} because of "${ruleName}" and value: "${ruleArgs}"`)
              const {errors} = await context.github.query(`
                mutation moveCard($cardId: ID!, $columnId: ID!) {
                  moveProjectCard(input: {cardId: $cardId, columnId: $columnId}) {
                    clientMutationId
                  }
                }
              `, {cardId: issueCard.id, columnId: column.id})
              if (errors) {
                return logger.error(errors)
              }
            }
          }
        }
      }
    })
  })
}
