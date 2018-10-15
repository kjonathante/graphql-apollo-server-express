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
import { Query, Subscription } from "react-apollo";

import { WebSocketLink } from 'apollo-link-ws';
import { split } from 'apollo-link';
import { getMainDefinition } from 'apollo-utilities';

// const client = new ApolloClient({
//   uri: "http://localhost:4000/graphql"
// });
// Create an http link:
const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql'
});

// Create a WebSocket link:
const wsLink = new WebSocketLink({
  uri: 'ws://localhost:4000/graphql',
  options: {
    reconnect: true
  }
});

// using the ability to split links, you can send data to each link
// depending on what kind of operation is being sent
const link = split(
  // split based on operation type
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === 'OperationDefinition' && operation === 'subscription';
  },
  wsLink,
  httpLink,
);

const client = new ApolloClient({
  // link: ApolloLink.from([
  //   onError(({ graphQLErrors, networkError }) => {
  //     if (graphQLErrors)
  //       graphQLErrors.map(({ message, locations, path }) =>
  //         console.log(
  //           `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
  //         ),
  //       );
  //     if (networkError) console.log(`[Network error]: ${networkError}`);
  //   }),
  //   new HttpLink({
  //     uri: 'http://localhost:4000/graphql',
  //     credentials: 'same-origin'
  //   })
  // ]),
  link: link,
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

const POSTS_SUBSCRIPTION = gql`
  subscription {
    postAdded {
      author
      comment
    }
  }
`;

const POSTS_QUERY = gql`
  query {
    posts {
      author
      comment
    }
  }
`;

const DontReadTheComments = () => (
  <Subscription subscription={POSTS_SUBSCRIPTION}>
    {({ data }) => (
      <h4>New post: {!data ? "...waiting" : data.postAdded.comment}</h4>
    )}
  </Subscription>
);

let unsubscribe = null;

const PostsWithSubscribe = () => (
  <Query query={POSTS_QUERY}>
    {({ loading, data, subscribeToMore }) => {
      if (loading) {
        return null;
      }

      if (!unsubscribe) {
        unsubscribe = subscribeToMore({
          document: POSTS_SUBSCRIPTION,
          updateQuery: (prev, { subscriptionData }) => {
            if (!subscriptionData.data) return prev;
            const { postAdded } = subscriptionData.data;
            console.log(subscriptionData.data)
            console.log(prev)
            return {
              ...prev,
              posts: [...prev.posts, postAdded]
            };
          }
        });
      }
      return <div>{data.posts.map(x => <h3 key={x.author}>{x.comment}</h3>)}</div>;
    }}
  </Query>
);

const App = () => (
  <ApolloProvider client={client}>
    <div>
      <DontReadTheComments />
      <h2>My first Apollo app 🚀</h2>
      <PostsWithSubscribe />
    </div>
  </ApolloProvider>
);

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
