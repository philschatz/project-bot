/* eslint-env jest */
const nock = require('nock')
const projectBot = require('..')
const Probot = require('probot')

const pullrequestOpened = require('./fixtures/pull_request.opened.json')
const issueOpened = require('./fixtures/issue.opened.json')
const {buildCard, buildRepoGraphQLResponseNew, buildGraphQLResponse} = require('./util')

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
      .reply(200, {data: buildRepoGraphQLResponseNew('repo-name', automationCards)})

    // Receive a webhook event
    await probot.receive({ event: 'pull_request', payload: pullrequestOpened })

    expect(nock.isDone()).toEqual(true)
  })

  test('new_pullrequest', async () => {
    await checkNewCommand({ new_pullrequest: [ 'my-repo-name' ] }, 'pull_request', pullrequestOpened)
  })

  test('new_issue', async () => {
    await checkNewCommand({ new_issue: [ 'my-repo-name' ] }, 'issues', issueOpened)
  })

  test('closed_issue', async () => {
    issueOpened.action = 'closed'
    await checkSimpleCommand({ closed_issue: [ 'my-repo-name' ] }, 'issues', issueOpened)
  })

  // test('closed_pullrequest', async () => {
  //   pullrequestOpened.action = 'closed'
  //   await checkSimpleCommand({ closed_pullrequest: [ 'my-repo-name' ]}, 'pull_request', pullrequestOpened)
  // })

  const checkNewCommand = async (card, eventName, payload) => {
    const automationCards = [[
      buildCard(card)
    ]]

    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, {data: buildRepoGraphQLResponseNew('repo-name', automationCards)})

    nock('https://api.github.com')
      .post('/graphql', (body) => {
        expect(body.query).toMatchSnapshot()
        return true
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ event: eventName, payload })

    expect(nock.isDone()).toEqual(true)
  }

  const checkSimpleCommand = async (card, eventName, payload) => {
    const automationCards = [[
      buildCard(card)
    ]]

    const s1 = nock('https://api.github.com')
      .post('/graphql')
      .reply(200, {data: buildGraphQLResponse('repo-name', automationCards)})

    const s2 = nock('https://api.github.com')
      .post('/graphql', (body) => {
        expect(body.query).toMatchSnapshot()
        return true
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ event: eventName, payload })

    expect(s1.isDone()).toEqual(true)
    expect(s2.isDone()).toEqual(true)
    expect(nock.isDone()).toEqual(true)
  }
})
