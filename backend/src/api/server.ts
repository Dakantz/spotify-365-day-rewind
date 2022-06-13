import { ApolloServer } from "apollo-server";
import { loadSchema } from "@graphql-tools/load";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { contextFunc, createUser, SContext } from "./auth";
import { resolvers } from "./resolver";
import { join } from "path";
(async () => {

    process.on('uncaughtException', (err) => console.error(err))
    process.on('unhandledRejection', (err) => console.error(err))
    let schema = await loadSchema(join(__dirname, "../../schema.graphql"), {
        loaders: [new GraphQLFileLoader()],
        resolvers,
    });
    let server = new ApolloServer({
        schema,
        context: contextFunc,
        tracing: true,
    });
    let port = process.env.PORT ? process.env.PORT : 4040;
    await server.listen({
        url: "/graphql",
        port: port,
    });
    console.log(`Ready omn port ${port}`);
})()
    .then(() => { })
    .catch((e) => {
        console.error("Error:", e);
    });
