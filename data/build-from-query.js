const {writeFileSync} = require('fs')
const {join: pathJoin} = require('path')
const {default: fromQuery} = require('@gql2ts/from-query')
const schema = require('./schema')

const queries = [
  'getAllProjectCards',
  'getCardAndColumnAutomationCards'
]

queries.forEach((queryName) => {

  const query = require(`./${queryName}/graphql`)
  const typescriptDefinitions = fromQuery(schema, query)

  const allDefinitions = typescriptDefinitions.map(({ result }) => result).join('\n')

  writeFileSync(pathJoin(__dirname, queryName, 'index.d.ts'), allDefinitions)

})
