const commonmark = require('commonmark')

const commonmarkParser = new commonmark.Parser()
function ALWAYS_TRUE () { return true }
async function paginate (octokit, response) {
  let {data} = response
  while (octokit.hasNextPage(response)) {
    response = await octokit.getNextPage(response)
    data = data.concat(response.data)
  }
  return data
}

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

const AUTOMATION_RULE_NAMES = AUTOMATION_COMMANDS.map(({ruleName}) => ruleName)

module.exports = (robot) => {
  const logger = robot.log.child({name: 'project-bot'})
  robot.events.setMaxListeners(Math.max(robot.events.getMaxListeners(), 20)) // Since we register at least 19 listeners
  logger.info(`Starting up`)

  // Load all the Cards in memory because there is no way to lookup which projects an Issue is in
  const CARD_LOOKUP = {} // Key is "{issue_url}" and value is [{projectId, cardId}]
  const ORG_PROJECTS = {} // Only load this once for each org
  const REPO_PROJECTS = {} // Only load this once for each repo
  const AUTOMATION_CARDS = {} // Derived from parsing the *magic* "Automation Rules" cards. Key is "{projectId}" and value is [{columnId, ruleName, ruleArgs}]
  let populatedCacheAlready = false

  const USER_CACHED = {} // Key is the username, Value is the type of the User (User, Organization)
  const PROJECTS_CACHED = {} // Key is "{username}/{repoName}", Value is `true`
  const COLUMN_CACHE = {} // Key is columnId, Value is {projectId, ownerUrl}. Unfortunately, https://developer.github.com/v3/activity/events/types/#projectcardevent does not contain the projectId but it does have the columnId so we can look it up

  function addOrUpdateAutomationCache (context, projectId, columnId, projectCard, ownerUrl) {
    if (!projectId) {
      throw new Error(`BUG: Could not find projectId for card. JSON=${JSON.stringify(projectCard)}`)
    }
    if (!projectCard.note) {
      return
    }
    logger.debug(projectCard, `Checking whether the card is an AUTOMATION_CARD`)
    // Check if it is one of the special "Automation Rules" cards
    let hasMagicTitle = false
    let walkEvent
    const root = commonmarkParser.parse(projectCard.note)
    const walker = root.walker()
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
          AUTOMATION_CARDS[projectId] = AUTOMATION_CARDS[projectId] || []

          // Find the card if it exists and remove it
          const existingEntry = AUTOMATION_CARDS[projectId].filter(({cardId, ruleName}) => cardId === projectCard.id && ruleName === node.literal)[0]
          if (existingEntry) {
            AUTOMATION_CARDS[projectId].splice(AUTOMATION_CARDS[projectId].indexOf(existingEntry), 1)
          }

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

          logger.info(`Detected Automation Rule: ${node.literal} with args=${JSON.stringify(args)} on Card ${projectCard.url}`)
          AUTOMATION_CARDS[projectId].push({
            cardId: projectCard.id, // Store the cardId so we can update it if the card is edited
            columnId: columnId,
            ownerUrl: ownerUrl,
            ruleName: node.literal,
            ruleArgs: args
          })
        }
      }
    }
  }

  function addOrUpdateCardCache (projectId, projectCard) {
    CARD_LOOKUP[projectCard.content_url] = CARD_LOOKUP[projectCard.content_url] || {}
    CARD_LOOKUP[projectCard.content_url][projectCard.id] = {projectId: projectId, cardId: projectCard.id}
  }

  async function populateCache (context) {
    logger.trace('starting populateCache (may return quickly)')
    // Loop through all the cards, populating the CARD_LOOKUP and the AUTOMATION_CARDS
    const username = context.repo().owner
    let cachedUserInfo = USER_CACHED[username]
    if (!cachedUserInfo) {
      logger.trace('looking up user type')
      const {data: userInfo} = await context.github.users.getForUser({username: username})
      cachedUserInfo = userInfo.type
    }

    let projects = []
    if (cachedUserInfo === 'User') {
      // Ensure Projects for this repo have been added
      if (!PROJECTS_CACHED[`${username}/${context.repo().repo}`]) {
        projects = (await context.github.projects.getRepoProjects(context.repo({state: 'open'}))).data
        logger.info(`Loading all Repo projects for ${username}/${context.repo().repo} (${projects.length})`)
        PROJECTS_CACHED[`${username}/${context.repo().repo}`] = true
      }
    } else if (cachedUserInfo === 'Organization') {
      // Ensure Projects for this org have been added
      if (!PROJECTS_CACHED[username]) {
        projects = (await context.github.projects.getOrgProjects({org: username, state: 'open'})).data
        logger.info(`Loading all Organization projects for ${username} (${projects.length})`)
        PROJECTS_CACHED[username] = true
      }
    }

    // Loop over all the new projects, looking for the AUTOMATION_CARDS
    for (const project of projects) {
      logger.trace(`Inspecting all cards in project ${project.url}`)
      const projectId = project.id
      const {data: projectColumns} = await context.github.projects.getProjectColumns({project_id: projectId})
      for (const projectColumn of projectColumns) {
        logger.trace(`Inspecting all cards in Column ${projectColumn.url}`)
        COLUMN_CACHE[projectColumn.id] = {projectId, ownerUrl: project.owner_url}
        const projectCards = await paginate(context.github, await context.github.projects.getProjectCards({column_id: projectColumn.id}))

        for (const projectCard of projectCards) {
          // Issues can belong to multiple cards
          if (projectCard.note) {
            addOrUpdateAutomationCache(context, projectId, projectColumn.id, projectCard, project.owner_url)
          } else if (projectCard.content_url) {
            addOrUpdateCardCache(projectId, projectCard)
          } else {
            logger.error(projectCard, `Could not do anything with this card`)
          }
        }
      }
    }

    USER_CACHED[username] = cachedUserInfo

    // Only populate based on the config file once
    if (populatedCacheAlready) {
      return
    }

    populatedCacheAlready = true
  }

  // register a listener when a Card changes so we can re-parse it if it is an "Automation Rules" Card
  robot.on(['project_card.edited', 'project_card.created', 'project_card.moved'], async (context) => {
    logger.debug(`Card Changed`)
    // await populateCache(context) This command does not work because context.repo() does not really apply in this case (when it's an Org )

    const projectCard = context.payload.project_card
    if (COLUMN_CACHE[projectCard.column_id]) {
      const {projectId, ownerUrl} = COLUMN_CACHE[projectCard.column_id]
      if (projectCard.note) {
        addOrUpdateAutomationCache(context, projectId, projectCard.column_id, projectCard, ownerUrl)
      } else if (projectCard.content_url) {
        addOrUpdateCardCache(projectId, projectCard)
      } else {
        logger.error(projectCard, `Could not do anything with this card`)
      }
    } else {
      logger.error(projectCard, `Could not find column for card in COLUMN_CACHE`)
    }
  })

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
      await populateCache(context)

      if (createsACard) {
        // Loop through all of the AUTOMATION_CARDS and see if any match
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
        const cardsForIssue = Object.values(CARD_LOOKUP[issueUrl] || {})

        // At this point we need the cards and columns that need to be moved.
        const matchedColumnInfos = cardsForIssue.map(({projectId, cardId, projectConfig}) => {
          // Check if there are any columns that match the ruleName.
          // If so, return the following:
          // - ruleArgs (most of the time it is just `true`)
          // - columnInfo
          // - cardId
          // - projectId

          let columnInfo = null
          let ruleArgs = null

          // First, check if there is an "Automation Rules" that contains the rule
          if (AUTOMATION_CARDS[projectId]) {
            const maybeMatched = AUTOMATION_CARDS[projectId].filter(({ruleName: rn}) => rn === ruleName)[0]
            if (maybeMatched) {
              columnInfo = {id: maybeMatched.columnId}
              ruleArgs = maybeMatched.ruleArgs
            }
          }

          if (projectConfig) {
            // Not all Cards have a projectConfig. If the .yml file did not contain a config for the project that this card was in then it would not have a projectConfig
            for (const column of projectConfig.columns) {
              if (column.rules[ruleName]) {
                if (columnInfo) {
                  logger.error(`Duplicate rule named "${ruleName}" within project config (could also be overridden by and "Automation Rule" card) ${JSON.stringify(projectConfig)}`)
                } else {
                  columnInfo = column
                  ruleArgs = column.rules[ruleName]
                }
              }
            }
          }

          if (columnInfo) {
            return {
              columnInfo,
              cardId,
              projectId,
              ruleArgs
            }
          } else {
            return null
          }
        }).filter((info) => !!info) // remove all the nulls (ruleName not found in this projectConfig)

        logger.debug(`Matched ${matchedColumnInfos.length} possible columns. Checking if it actually matches any.`)
        matchedColumnInfos.forEach(async ({columnInfo, cardId, projectId, ruleArgs}) => {
          if (await ruleMatcher(logger, context, ruleArgs)) {
            // Move the Card
            const {data: columns} = await context.github.projects.getProjectColumns({project_id: projectId})

            // Find the correct column
            let columnId
            if (columnInfo.id) {
              columnId = columnInfo.id
            } else if (columnInfo.index) {
              columnId = columns[columnInfo.index].id
              logger.warn(`Consider identifying the column by "id: ${columnId}" rather than by index in JSON=${JSON.stringify(columnInfo)}`)
            }

            if (!columnId) {
              logger.error(`Could not find column for JSON=${JSON.stringify(columnInfo)}`)
              return
            }
            logger.info(`Moving Card ${cardId} for "${issueUrl}" to column ${columnId} because of "${ruleName}" and value: "${ruleArgs}"`)
            await context.github.projects.moveProjectCard({id: cardId, column_id: columnId, position: 'top'})
          }
        })
      }
    })
  })
}
