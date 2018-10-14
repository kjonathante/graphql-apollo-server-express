import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
// import App from "./App";
import * as serviceWorker from "./serviceWorker";

// import ApolloClient from "apollo-boost";
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import { onError } from 'apollo-link-error';
import { ApolloLink } from 'apollo-link';

import gql from "graphql-tag";
import { ApolloProvider } from "react-apollo";
import { Query } from "react-apollo";

// const client = new ApolloClient({
//   uri: "http://localhost:4000/graphql"
// });
const client = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors)
        graphQLErrors.map(({ message, locations, path }) =>
          console.log(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
          ),
        );
      if (networkError) console.log(`[Network error]: ${networkError}`);
    }),
    new HttpLink({
      uri: 'http://localhost:4000/graphql',
      credentials: 'same-origin'
    })
  ]),
  cache: new InMemoryCache()
});

const Posts = () => (
  <Query
    query={gql`
      {
        posts {
          author
          comment
        }
      }
    `}
  >
    {({ loading, error, data }) => {
      if (loading) return <p>Loading...</p>;
      if (error) return <p>Error :(</p>;

      return data.posts.map(({ author, comment }) => (
        <div key={author}>
          <p>{`${author}: ${comment}`}</p>
        </div>
      ));
    }}
  </Query>
);

const App = () => (
  <ApolloProvider client={client}>
    <div>
      <h2>My first Apollo app 🚀</h2>
      <Posts />
    </div>
  </ApolloProvider>
);

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
