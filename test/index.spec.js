/* eslint-env jest */
const nock = require('nock')
const projectBot = require('..')
const Probot = require('probot')

const pullrequestOpened = require('./fixtures/pull_request.opened.json')
const issueOpened = require('./fixtures/issue.opened.json')
const {buildCard, getAllProjectCards, getCardAndColumnAutomationCards} = require('./util')

nock.disableNetConnect()

describe('project-bot', () => {
  let probot

  beforeEach(() => {
    probot = Probot({})
    const app = probot.load(projectBot)
    // just return a test token
    app.app = () => 'test'
  })

  test('sanity', async () => {
    let automationCards = [[]]

    // Probot checks to see if it is installed
    nock('https://api.github.com')
      .post('/app/installations/12345/access_tokens')
      .reply(200, { token: 'test' })

    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, {data: getAllProjectCards('repo-name', automationCards)})

    // Receive a webhook event
    await probot.receive({ event: 'pull_request', payload: pullrequestOpened })

    expect(nock.isDone()).toEqual(true)
  })

  describe('new_* commands', () => {
    test('any new_pullrequest', async () => {
      await checkNewCommand({ new_pullrequest: true }, 'pull_request', pullrequestOpened)
    })

    test('new_pullrequest', async () => {
      await checkNewCommand({ new_pullrequest: [ 'my-repo-name' ] }, 'pull_request', pullrequestOpened)
    })

    test('any new_issue', async () => {
      await checkNewCommand({ new_issue: true }, 'issues', issueOpened)
    })

    test('new_issue', async () => {
      await checkNewCommand({ new_issue: [ 'my-repo-name' ] }, 'issues', issueOpened)
    })
  })

  describe('simple commands', () => {
    test('closed_issue', async () => {
      issueOpened.action = 'closed'
      await checkCommand(1, { closed_issue: true }, 'issues', issueOpened)
    })
    test('edited_issue', async () => {
      issueOpened.action = 'edited'
      await checkCommand(1, { edited_issue: true }, 'issues', issueOpened)
    })
    test('demilestoned_issue', async () => {
      issueOpened.action = 'demilestoned'
      await checkCommand(1, { demilestoned_issue: true }, 'issues', issueOpened)
    })
    test('milestoned_issue', async () => {
      issueOpened.action = 'milestoned'
      await checkCommand(1, { milestoned_issue: true }, 'issues', issueOpened)
    })
    test('reopened_issue', async () => {
      issueOpened.action = 'reopened'
      await checkCommand(1, { reopened_issue: true }, 'issues', issueOpened)
    })
  })

  describe('slightly complicated commands (kludgy because the code makes too many GraphQL requests)', () => {
    test('closed_pullrequest', async () => {
      const payload = {...pullrequestOpened}
      payload.action = 'closed'
      payload.pull_request.merged = false
      await checkCommand(2, { closed_pullrequest: true }, 'pull_request', payload)
    })

    test('merged_pullrequest', async () => {
      const payload = {...pullrequestOpened}
      payload.action = 'closed'
      payload.pull_request.merged = true
      await checkCommand(2, { merged_pullrequest: true }, 'pull_request', payload)
    })

    test('reopened_pullrequest', async () => {
      const payload = {...pullrequestOpened}
      payload.action = 'reopened'
      await checkCommand(1, { reopened_pullrequest: true }, 'pull_request', payload)
    })
  })

  test('added_reviewer', async () => {
    const payload = {...pullrequestOpened}
    payload.action = 'review_requested'
    await checkCommand(1, { added_reviewer: true }, 'pull_request', payload)
  })

  describe('assignments', () => {
    test('assigned_to_issue', async () => {
      const payload = {...issueOpened}
      payload.action = 'assigned'
      payload.assignee = { login: 'testuser' }
      await checkCommand(2, { assigned_to_issue: ['testuser'] }, 'issues', payload)
    })

    test('assigned_issue', async () => {
      const payload = {...issueOpened}
      payload.action = 'assigned'
      payload.issue.assignees = [{ login: 'testuser' }]
      await checkCommand(2, { assigned_issue: true }, 'issues', payload)
    })

    test('unassigned_issue', async () => {
      const payload = {...issueOpened}
      payload.action = 'unassigned'
      payload.issue.assignees = []
      await checkCommand(1, { unassigned_issue: true }, 'issues', payload)
    })

    test('assigned_pullrequest', async () => {
      const payload = {...pullrequestOpened}
      payload.action = 'assigned'
      payload.pull_request.assignees = [{ login: 'testuser' }]
      await checkCommand(1, { assigned_pullrequest: true }, 'pull_request', payload)
    })

    test('unassigned_pullrequest', async () => {
      const payload = {...pullrequestOpened}
      payload.action = 'unassigned'
      payload.pull_request.assignees = []
      await checkCommand(1, { unassigned_pullrequest: true }, 'pull_request', payload)
    })
  })

  describe('labels', () => {
    test('added_label (issue)', async () => {
      const payload = {...issueOpened}
      payload.action = 'labeled'
      payload.label = {name: 'testlabel'}
      await checkCommand(1, { added_label: ['testlabel'] }, 'issues', payload)
    })

    test('added_label (pullrequest)', async () => {
      const payload = {...pullrequestOpened}
      payload.action = 'labeled'
      payload.label = {name: 'testlabel'}
      await checkCommand(1, { added_label: ['testlabel'] }, 'pull_request', payload)
    })

    test('removed_label (issue)', async () => {
      const payload = {...issueOpened}
      payload.action = 'unlabeled'
      payload.label = {name: 'testlabel'}
      await checkCommand(1, { removed_label: ['testlabel'] }, 'issues', payload)
    })

    test('removed_label (pullrequest)', async () => {
      const payload = {...pullrequestOpened}
      payload.action = 'unlabeled'
      payload.label = {name: 'testlabel'}
      await checkCommand(1, { removed_label: ['testlabel'] }, 'pull_request', payload)
    })
  })

  const checkNewCommand = async (card, eventName, payload) => {
    const automationCards = [[
      buildCard(card)
    ]]

    // query getAllProjectCards
    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, {data: getAllProjectCards('repo-name', automationCards)})

    // mutation createCard
    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, {notNothing: 'sdlfjsdlkfj'})

    // Receive a webhook event
    await probot.receive({ event: eventName, payload })

    expect(nock.isDone()).toEqual(true)
  }

  const checkCommand = async (numGetCard, card, eventName, payload) => {
    const automationCards = [[
      buildCard(card)
    ]]

    // query getCardAndColumnAutomationCards
    const r1 = {data: getCardAndColumnAutomationCards('repo-name', automationCards)}
    for (let i = 0; i < numGetCard; i++) {
      nock('https://api.github.com')
        .post('/graphql')
        .reply(200, (uri, requestBody) => {
          expect(requestBody.query).toContain('query getCardAndColumnAutomationCards')
          expect(requestBody.variables.url).toBeTruthy()
          return r1
        })
    }

    // mutation moveCard
    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, (uri, requestBody) => {
        expect(requestBody.query).toContain('mutation moveCard')
        expect(requestBody.variables.cardId).toBeTruthy()
        expect(requestBody.variables.columnId).toBeTruthy()
      })

    // Receive a webhook event
    await probot.receive({ event: eventName, payload })

    if (!nock.isDone()) {
      console.error(nock.pendingMocks())
      expect(nock.isDone()).toEqual(true)
    }
  }
})
