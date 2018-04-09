// Common GraphQL Fragment for getting the Automation Cards out of the bottom of every Column in a Project
// This is a fragment used by other, actual queries

module.exports = `
  name
  id
  columns(first: 10) {
    totalCount
    nodes {
      id
      url
      firstCards: cards(first: 1) {
        totalCount
        nodes {
          url
          id
          note
        }
      }
      lastCards: cards(last: 1) {
        totalCount
        nodes {
          url
          id
          note
        }
      }
    }
  }
`
