import { ApolloServer } from "apollo-server";
import { GraphQLFileLoader, loadSchema } from "graphql-tools";
import { contextFunc, createUser, SContext } from "./auth";
import { resolvers } from "./resolver";
import { join } from "path";
(async () => {
  let schema = await loadSchema(join(__dirname, "../../schema.graphql"), {
    loaders: [new GraphQLFileLoader()],
    resolvers,
  });
  let server = new ApolloServer({
    schema,
    context: contextFunc,
  });
  await server.listen({
    url: "/graphql",
    port: process.env.PORT ? process.env.PORT : 4040,
  });
  console.log("Ready...");
})()
  .then(() => {})
  .catch((e) => {
    console.error("Error:", e);
  });
