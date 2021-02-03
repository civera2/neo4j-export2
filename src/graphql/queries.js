import { gql } from "apollo-boost";

export const GET_USER = gql`
  query($login: String!) {
    user(login: $login) {
      repositories(first: 100) {
        nodes {
          id
          name
          nameWithOwner
          createdAt
          isPrivate
          description
        }
      }
    }
  }
`;

export const GET_COMMITCOMMENTS = gql`
  query getCommitComments($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      commitComments(first: 50) {
        totalCount
        node {
          url
          author {
            login
            avatarUrl
          }
          createdAt
          body
          reactions(first: 100) {
            node {
              user {
                login
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_REPO = gql`
  query getRepo($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        author {
          login
          avatarUrl
        }
        id
        additions
        deletions
        body
        bodyHTML
        createdAt
        closedAt
        number
        state
        title
        url
        reactions(first: 100) {
          totalCount
          nodes {
            user {
              login
            }
          }
        }
        participants(first: 100) {
          totalCount
          nodes {
            login
            id
            ################################
            location
            following(first: 100) {
              totalCount
              nodes {
                id
              }
            }
            starredRepositories(first: 100) {
              totalCount
              nodes {
                id
              }
            }
            ################################
          }
        }
        reviewThreads(first: 50) {
          nodes {
            comments(first: 20) {
              totalCount
              nodes {
                body
                bodyHTML
                author {
                  login
                  avatarUrl
                }
                createdAt
                reactions(first: 15) {
                  totalCount
                  nodes {
                    user {
                      login
                    }
                  }
                }
              }
            }
          }
        }
        comments(first: 100) {
          nodes {
            body
            bodyHTML
            createdAt
            author {
              login
              avatarUrl
            }
            reactions(first: 50) {
              totalCount
              nodes {
                user {
                  login
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_REPOS = gql`
  query getRepos(
    $owner: String!
    $name: String!
    $beforeCursor: String
    $afterCursor: String
    $reactions: Int
    $participants: Int
    $comments: Int
    $commentsReactions: Int
    $rvThreads: Int
    $rvThreadsComments: Int
  ) {
    repository(owner: $owner, name: $name) {
      pullRequests(first: 15, before: $beforeCursor, after: $afterCursor) {
        nodes {
          id
          number
          title
          author {
            login
          }
          additions
          deletions
          createdAt
          closedAt
          state
          url
          body
          reactions(first: $reactions) {
            totalCount
            nodes {
              user {
                id
                login
              }
            }
          }
          participants(first: $participants) {
            totalCount
            nodes {
              id
              login
            }
          }
          comments(first: $comments) {
            totalCount
            nodes {
              body
              createdAt
              author {
                login
              }
              reactions(first: $commentsReactions) {
                totalCount
                nodes {
                  user {
                    id
                    login
                  }
                }
              }
            }
          }
          reviewThreads(first: $rvThreads) {
            totalCount
            nodes {
              comments(first: $rvThreadsComments) {
                totalCount
                nodes {
                  body
                  author {
                    login
                  }
                  createdAt
                  reactions(first: 20) {
                    totalCount
                    nodes {
                      user {
                        id
                        login
                      }
                    }
                  }
                }
              }
            }
          }
        }
        pageInfo {
          startCursor
          hasNextPage
          endCursor
        }
      }
    }
  }
`;
/*{"owner": "twitter", 
"name": "serial", 
"afterCursor": null,
"comments": 1,
"commentsReactions": 1,
"rvThreads": 1, 
"rvThreadsComments": 1
}*/

export const USER = gql`
  query userstats($owner: String!) {
    user(login: $owner) {
      login
      url
      avatarUrl
      followers(first: 1) {
        totalCount
      }
      following(first: 1) {
        totalCount
      }
    }
  }
`;

export const USER_STATS = gql`
  query userstats($owner: String!) {
    repositoryOwner(login: $owner) {
      repositories(first: 100) {
        totalCount
        nodes {
          watchers(first: 1) {
            totalCount
          }
          forkCount
          stargazers(first: 1) {
            totalCount
          }
        }
      }
    }
  }
`;

export const REPOSITORY_PRS = gql`
  query getPRcant($name: String!, $owner: String!) {
    repository(name: $name, owner: $owner) {
      pullRequests(first: 1) {
        totalCount
      }
    }
  }
`;

export const RATE_LIMIT = gql`
  query rateLimit {
    rateLimit {
      limit
      remaining
      resetAt
    }
  }
`;
