import { users } from "@prisma/client";
import { IResolvers } from "graphql-tools";
import { createUser, SContext } from "./auth";
import { GQLError, GQLUser } from "./returnTypes";
export const resolvers = {
  Query: {
    clientToken: (
      parent: any,
      args: { [key: string]: string },
      context: SContext
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
      try {
        return await createUser(args.code, args.redirectUrl, context);
      } catch (error) {
        console.error("Error creating user", error);
        return new GQLError(error.message);
      }
    },
  },
};
