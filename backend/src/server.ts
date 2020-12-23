import { ApolloServer } from "apollo-server";
import { GraphQLFileLoader, loadSchema } from "graphql-tools";
import { contextFunc, createUser, SContext } from "./auth";
import { resolvers } from "./resolver";
import { join } from "path";
(async () => {
  let schema = await loadSchema(join(__dirname, "../schema.graphql"), {
    loaders: [new GraphQLFileLoader()],
  });
  let server = new ApolloServer({
    schema,
    resolvers: {
      Query: {
        clientToken: (
          parent: any,
          args: { [key: string]: string },
          context: SContext,
          info: any
        ) => {
          console.log("got req", process.env);
          return process.env.SPOTIFY_CLIENT_ID;
        },
      },
      Mutation: {
        registerOrLogin: async (
          parent: any,
          args: { [key: string]: string },
          context: SContext,
          info: any
        ) => {
          await createUser(args.code, args.redirectUrl);
        },
      },
    },
    context: contextFunc,
  });
  server.listen({
    url: "/graphql",
    port: process.env.PORT ? process.env.PORT : 4040,
  });
})()
  .then(() => {})
  .catch((e) => {
    console.error("Error:", e);
  });
