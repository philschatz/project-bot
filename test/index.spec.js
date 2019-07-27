/* eslint-env jest */
const nock = require('nock')
const projectBot = require('..')
const Probot = require('probot')

const pullrequestOpened = require('./fixtures/pull_request.opened.json')
const {buildCard, buildRepoGraphQLResponse} = require('./util')

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
    let cards = [[]]

    // Probot checks to see if it is installed
    nock('https://api.github.com')
      .post('/app/installations/12345/access_tokens')
      .reply(200, { token: 'test' })

    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, {data: buildRepoGraphQLResponse('repo-name', cards)})

    // Receive a webhook event
    await probot.receive({ event: 'pull_request', payload: pullrequestOpened })

    expect(nock.isDone()).toEqual(true)
  })

  test('pull_request.opened', async () => {
    const cards = [[
      buildCard({
        new_pullrequest: [ 'test' ]
      })
    ]]

    nock('https://api.github.com')
      .post('/graphql')
      .reply(200, {data: buildRepoGraphQLResponse('repo-name', cards)})

    nock('https://api.github.com')
      .post('/graphql', (body) => {
        expect(body.query).toMatchSnapshot()
        return true
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ event: 'pull_request', payload: pullrequestOpened })

    expect(nock.isDone()).toEqual(true)
  })
})
