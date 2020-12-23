import { IResolvers } from "graphql-tools";
import { createUser, SContext } from "./auth";
export const resolvers = {
  Query: {
    clientToken: () => {
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
      await createUser(args.code, args.redirectUrl, context);
    },
  },
};
