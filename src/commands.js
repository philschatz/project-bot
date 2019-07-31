function ALWAYS_TRUE () { return true }

module.exports = [
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
    ruleName: 'added_label',
    webhookName: 'pull_request.labeled',
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
    ruleName: 'removed_label',
    webhookName: 'pull_request.unlabeled',
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
      const issue = context.issue()
      const { data: reviews } = await context.github.pullRequests.listReviews({ owner: issue.owner, repo: issue.repo, pull_number: issue.number })
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
