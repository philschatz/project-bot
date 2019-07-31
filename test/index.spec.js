/* eslint-env jest */
const nock = require('nock')
const projectBot = require('..')
const { Probot } = require('probot')

const pullrequestOpened = require('./fixtures/pull_request.opened.json')
const issueOpened = require('./fixtures/issue.opened.json')
const { buildCard, getAllProjectCards, getCardAndColumnAutomationCards } = require('./util')

nock.disableNetConnect()

describe('project-bot integration tests', () => {
  let probot

  beforeEach(() => {
    nock.cleanAll()
    probot = new Probot({ githubToken: 'faketoken' })
    const app = probot.load(projectBot)
    // just return a test token
    app.app = () => 'test'
  })

  test('sanity', async () => {
    const automationCards = [[]]

    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, { data: getAllProjectCards('repo-name', automationCards) })

    // Receive a webhook event
    await probot.receive({ name: 'pull_request', payload: pullrequestOpened })

    expect(nock.isDone()).toEqual(true)
  })

  describe('new_* commands', () => {
    test('any new_pullrequest', async () => {
      await checkNewCommand(true, { new_pullrequest: true }, 'pull_request', pullrequestOpened)
    })

    test('new_pullrequest', async () => {
      await checkNewCommand(true, { new_pullrequest: ['my-repo-name'] }, 'pull_request', pullrequestOpened)
    })

    test('new_pullrequest (unsatisfied)', async () => {
      await checkNewCommand(false, { new_pullrequest: ['another-repo-name'] }, 'pull_request', pullrequestOpened)
    })

    test('any new_issue', async () => {
      await checkNewCommand(true, { new_issue: true }, 'issues', issueOpened)
    })

    test('new_issue', async () => {
      await checkNewCommand(true, { new_issue: ['my-repo-name'] }, 'issues', issueOpened)
    })

    test('new_issue (unsatisfied)', async () => {
      await checkNewCommand(false, { new_issue: ['another-repo-name'] }, 'issues', issueOpened)
    })
  })

  describe('simple commands', () => {
    test('closed_issue', async () => {
      issueOpened.action = 'closed'
      await checkCommand(true, 1, { closed_issue: true }, 'issues', issueOpened)
    })
    test('edited_issue', async () => {
      issueOpened.action = 'edited'
      await checkCommand(true, 1, { edited_issue: true }, 'issues', issueOpened)
    })
    test('demilestoned_issue', async () => {
      issueOpened.action = 'demilestoned'
      await checkCommand(true, 1, { demilestoned_issue: true }, 'issues', issueOpened)
    })
    test('milestoned_issue', async () => {
      issueOpened.action = 'milestoned'
      await checkCommand(true, 1, { milestoned_issue: true }, 'issues', issueOpened)
    })
    test('reopened_issue', async () => {
      issueOpened.action = 'reopened'
      await checkCommand(true, 1, { reopened_issue: true }, 'issues', issueOpened)
    })
  })

  describe('slightly complicated commands (kludgy because the code makes too many GraphQL requests)', () => {
    test('closed_pullrequest', async () => {
      const payload = { ...pullrequestOpened }
      payload.action = 'closed'
      payload.pull_request.merged = false
      await checkCommand(true, 2, { closed_pullrequest: true }, 'pull_request', payload)
    })

    test('merged_pullrequest', async () => {
      const payload = { ...pullrequestOpened }
      payload.action = 'closed'
      payload.pull_request.merged = true
      await checkCommand(true, 2, { merged_pullrequest: true }, 'pull_request', payload)
    })

    test('reopened_pullrequest', async () => {
      const payload = { ...pullrequestOpened }
      payload.action = 'reopened'
      await checkCommand(true, 1, { reopened_pullrequest: true }, 'pull_request', payload)
    })
  })

  describe('assignments', () => {
    test('assigned_to_issue', async () => {
      const payload = { ...issueOpened }
      payload.action = 'assigned'
      payload.assignee = { login: 'testuser' }
      await checkCommand(true, 2, { assigned_to_issue: ['testuser'] }, 'issues', payload)
    })

    test('assigned_to_issue (unsatisfied)', async () => {
      const payload = { ...issueOpened }
      payload.action = 'assigned'
      payload.assignee = { login: 'testuser' }
      await checkCommand(false, 2, { assigned_to_issue: ['someotheruser'] }, 'issues', payload)
    })

    test('assigned_to_issue (unsatisfied) no username provided', async () => {
      const payload = { ...issueOpened }
      payload.action = 'assigned'
      payload.assignee = { login: 'testuser' }
      await checkCommand(false, 2, { assigned_to_issue: true }, 'issues', payload)
    })

    test('assigned_issue', async () => {
      const payload = { ...issueOpened }
      payload.action = 'assigned'
      payload.issue.assignees = [{ login: 'testuser' }]
      await checkCommand(true, 2, { assigned_issue: true }, 'issues', payload)
    })

    test('assigned_issue (unsatisfied)', async () => {
      const payload = { ...issueOpened }
      payload.action = 'assigned'
      payload.issue.assignees = [{ login: 'testuser' }, { login: 'anotheruser' }]
      await checkCommand(false, 2, { assigned_issue: true }, 'issues', payload)
    })

    test('unassigned_issue', async () => {
      const payload = { ...issueOpened }
      payload.action = 'unassigned'
      payload.issue.assignees = []
      await checkCommand(true, 1, { unassigned_issue: true }, 'issues', payload)
    })

    test('unassigned_issue (unsatisfied)', async () => {
      const payload = { ...issueOpened }
      payload.action = 'unassigned'
      payload.issue.assignees = [{ login: 'testuser' }]
      await checkCommand(false, 1, { unassigned_issue: true }, 'issues', payload)
    })

    test('assigned_pullrequest', async () => {
      const payload = { ...pullrequestOpened }
      payload.action = 'assigned'
      payload.pull_request.assignees = [{ login: 'testuser' }]
      await checkCommand(true, 1, { assigned_pullrequest: true }, 'pull_request', payload)
    })

    test('assigned_pullrequest (unsatisfied)', async () => {
      const payload = { ...pullrequestOpened }
      payload.action = 'assigned'
      payload.pull_request.assignees = [{ login: 'testuser' }, { login: 'anotheruser' }]
      await checkCommand(false, 1, { assigned_pullrequest: true }, 'pull_request', payload)
    })

    test('unassigned_pullrequest', async () => {
      const payload = { ...pullrequestOpened }
      payload.action = 'unassigned'
      payload.pull_request.assignees = []
      await checkCommand(true, 1, { unassigned_pullrequest: true }, 'pull_request', payload)
    })

    test('unassigned_pullrequest (unsatisfied)', async () => {
      const payload = { ...pullrequestOpened }
      payload.action = 'unassigned'
      payload.pull_request.assignees = [{ login: 'testuser' }]
      await checkCommand(false, 1, { unassigned_pullrequest: true }, 'pull_request', payload)
    })
  })

  describe('labels', () => {
    test('added_label (issue)', async () => {
      const payload = { ...issueOpened }
      payload.action = 'labeled'
      payload.label = { name: 'testlabel' }
      await checkCommand(true, 1, { added_label: ['testlabel'] }, 'issues', payload)
    })

    test('added_label (pullrequest)', async () => {
      const payload = { ...pullrequestOpened }
      payload.action = 'labeled'
      payload.label = { name: 'testlabel' }
      await checkCommand(true, 1, { added_label: ['testlabel'] }, 'pull_request', payload)
    })

    test('added_label (issue) (unsatisfied)', async () => {
      const payload = { ...issueOpened }
      payload.action = 'labeled'
      payload.label = { name: 'testlabel' }
      await checkCommand(false, 1, { added_label: ['anotherlabel'] }, 'issues', payload)
    })

    test('added_label (pullrequest) (unsatisfied)', async () => {
      const payload = { ...pullrequestOpened }
      payload.action = 'labeled'
      payload.label = { name: 'testlabel' }
      await checkCommand(false, 1, { added_label: ['anotherlabel'] }, 'pull_request', payload)
    })

    test('removed_label (issue)', async () => {
      const payload = { ...issueOpened }
      payload.action = 'unlabeled'
      payload.label = { name: 'testlabel' }
      await checkCommand(true, 1, { removed_label: ['testlabel'] }, 'issues', payload)
    })

    test('removed_label (pullrequest)', async () => {
      const payload = { ...pullrequestOpened }
      payload.action = 'unlabeled'
      payload.label = { name: 'testlabel' }
      await checkCommand(true, 1, { removed_label: ['testlabel'] }, 'pull_request', payload)
    })

    test('removed_label (issue) (unsatisfied)', async () => {
      const payload = { ...issueOpened }
      payload.action = 'unlabeled'
      payload.label = { name: 'testlabel' }
      await checkCommand(false, 1, { removed_label: ['anotherlabel'] }, 'issues', payload)
    })

    test('removed_label (pullrequest) (unsatisfied)', async () => {
      const payload = { ...pullrequestOpened }
      payload.action = 'unlabeled'
      payload.label = { name: 'testlabel' }
      await checkCommand(false, 1, { removed_label: ['anotherlabel'] }, 'pull_request', payload)
    })
  })

  describe('pullrequest reviews', () => {
    test('added_reviewer', async () => {
      const payload = { ...pullrequestOpened }
      payload.action = 'review_requested'
      await checkCommand(true, 1, { added_reviewer: true }, 'pull_request', payload)
    })

    test('accepted_pullrequest', async () => {
      const payload = { ...pullrequestOpened }
      payload.action = 'submitted'
      await checkReviewCommand(true, 1, { accepted_pullrequest: true }, 'pull_request_review', payload, [
        { state: 'APPROVED' }
      ])
    })

    test('accepted_pullrequest (unsatisfied) because no one reviewed', async () => {
      const payload = { ...pullrequestOpened }
      payload.action = 'submitted'
      await checkReviewCommand(false, 1, { accepted_pullrequest: true }, 'pull_request_review', payload, [])
    })

    test('accepted_pullrequest (unsatisfied) because no one accepted', async () => {
      const payload = { ...pullrequestOpened }
      payload.action = 'submitted'
      await checkReviewCommand(false, 1, { accepted_pullrequest: true }, 'pull_request_review', payload, [
        { state: 'PENDING' }
      ])
    })

    test('accepted_pullrequest (unsatisfied) because someone requested changes', async () => {
      const payload = { ...pullrequestOpened }
      payload.action = 'submitted'
      await checkReviewCommand(false, 1, { accepted_pullrequest: true }, 'pull_request_review', payload, [
        { state: 'REQUEST_CHANGES' }
      ])
    })
  })

  describe('misc', () => {
    test('ignores non-note cards', async () => {
      const payload = { ...issueOpened }
      payload.action = 'labeled'
      payload.label = { name: 'testlabel' }

      await checkCommand(false, 1, null, 'issues', payload)
    })

    test('parses backwards-compatible cards', async () => {
      const payload = { ...issueOpened }
      payload.action = 'labeled'
      payload.label = { name: 'testlabel' }

      await checkCommand(true, 1, `###### Automation Rules

<!-- Documentation: https://github.com/philschatz/project-bot -->

- \`added_label\` testlabel
`, 'issues', payload)
    })

    test('ignores malformed cards (backticks in the wrong place)', async () => {
      const payload = { ...issueOpened }
      payload.action = 'labeled'
      payload.label = { name: 'testlabel' }

      await checkCommand(false, 1, `###### Automation Rules
  
  <!-- Documentation: https://github.com/philschatz/project-bot -->
  
  ** \`added_label\` ** testlabel
  `, 'issues', payload)
    })
  })

  const checkNewCommand = async (createsACard, card, eventName, payload) => {
    const automationCards = [[
      buildCard(card)
    ]]

    // query getAllProjectCards
    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, { data: getAllProjectCards('repo-name', automationCards) })

    if (createsACard) {
      // mutation createCard
      nock('https://api.github.com')
        .post('/graphql')
        .reply(200)
    }

    // Receive a webhook event
    await probot.receive({ name: eventName, payload })

    expect(nock.isDone()).toEqual(true)
  }

  const checkCommand = async (shouldMove, numGetCard, card, eventName, payload) => {
    const automationCards = [[
      typeof card === 'string' ? card : buildCard(card)
    ]]

    // query getCardAndColumnAutomationCards
    const r1 = { data: getCardAndColumnAutomationCards('repo-name', automationCards) }
    for (let i = 0; i < numGetCard; i++) {
      nock('https://api.github.com')
        .post('/graphql')
        .reply(200, (uri, requestBody) => {
          requestBody = JSON.parse(requestBody)
          expect(requestBody.query).toContain('query getCardAndColumnAutomationCards')
          expect(requestBody.variables.issueUrl).toBeTruthy()
          return r1
        })
    }

    if (shouldMove) {
      // mutation moveCard
      nock('https://api.github.com')
        .post('/graphql')
        .reply(200, (uri, requestBody) => {
          requestBody = JSON.parse(requestBody)
          expect(requestBody.query).toContain('mutation moveCard')
          expect(requestBody.variables.cardId).toBeTruthy()
          expect(requestBody.variables.columnId).toBeTruthy()
        })
    }

    // Receive a webhook event
    await probot.receive({ name: eventName, payload })

    if (!nock.isDone()) {
      console.error(nock.pendingMocks())
      expect(nock.isDone()).toEqual(true)
    }
  }

  const checkReviewCommand = async (shouldMove, numGetCard, card, eventName, payload, reviews) => {
    const automationCards = [[
      buildCard(card)
    ]]

    // query getCardAndColumnAutomationCards
    const r1 = { data: getCardAndColumnAutomationCards('repo-name', automationCards) }
    for (let i = 0; i < numGetCard; i++) {
      nock('https://api.github.com')
        .post('/graphql')
        .reply(200, (uri, requestBody) => {
          requestBody = JSON.parse(requestBody)
          expect(requestBody.query).toContain('query getCardAndColumnAutomationCards')
          expect(requestBody.variables.issueUrl).toBeTruthy()
          return r1
        })
    }

    nock('https://api.github.com')
      .get('/repos/my-org-name/my-repo-name/pulls/113/reviews')
      .reply(200, reviews)

    if (shouldMove) {
      // mutation moveCard
      nock('https://api.github.com')
        .post('/graphql')
        .reply(200, (uri, requestBody) => {
          requestBody = JSON.parse(requestBody)
          expect(requestBody.query).toContain('mutation moveCard')
          expect(requestBody.variables.cardId).toBeTruthy()
          expect(requestBody.variables.columnId).toBeTruthy()
        })
    }

    // Receive a webhook event
    await probot.receive({ name: eventName, payload })

    if (!nock.isDone()) {
      console.error(nock.pendingMocks())
      expect(nock.isDone()).toEqual(true)
    }
  }
})
