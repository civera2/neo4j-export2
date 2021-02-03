import Vue from 'vue'
import VueApollo from 'vue-apollo'
import ApolloClient from 'apollo-boost'
//import { createApolloClient, restartWebsockets } from 'vue-cli-plugin-apollo/graphql-client'

// Install the vue plugin
Vue.use(VueApollo)

var authToken = localStorage.getItem("tokenId")
// Call this in the Vue app file
export function createProvider () {
  //creating apollo client
  const client = new ApolloClient({
    uri: "https://api.github.com/graphql",
    request: operation => {
      operation.setContext({
        headers: {
          authorization: 'Bearer '+ authToken
        },
      });
    }
  });

  // Create vue apollo provider
  const apolloProvider = new VueApollo({
    defaultClient: client,
    errorHandler (error) {
      // eslint-disable-next-line no-console
      console.log('%cError', 'background: red; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;', error.message)
    },
  })

  return apolloProvider
}