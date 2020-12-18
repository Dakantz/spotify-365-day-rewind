import { ApolloServer } from "apollo-server";
import { GraphQLFileLoader, loadSchema } from "graphql-tools";

(async () => {
  let schema = await loadSchema("../schema.graphql", {
    loaders: [new GraphQLFileLoader()],
  });
  let resolvers={

  }
  let context=async ()=>{

  }
  let server=new ApolloServer({
      schema,
      resolvers,
      context
  })
})()
  .then(() => {})
  .catch((e) => {
    console.error("Error:", e);
  });
