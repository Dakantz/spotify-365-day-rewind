import { users } from "@prisma/client";
import { IResolvers } from "graphql-tools";
import { SpotifyClient } from "../shared";
import { DeleteUserJob, ExportMeJob } from "../shared/types";
import { createUser, SContext } from "./auth";
import { GQLError, GQLMessage, GQLStats, GQLUser } from "../shared/returnTypes";
import { Stats } from "../shared/statistics";
export const resolvers = {
  Stats: {
    steps: async (
      parent: GQLStats,
      args: { [key: string]: any },
      context: SContext
    ) => {
      let stats = new Stats(context.db);
      return await stats.steps(parent);
    },
    total: async (
      parent: GQLStats,
      args: { [key: string]: any },
      context: SContext
    ) => {
      let stats = new Stats(context.db);
      return await stats.total(parent);
    },
  },
  User: {
    mostPlayedSongs: async (
      parent: GQLUser,
      args: { [key: string]: any },
      context: SContext
    ) => {
      let stats = new Stats(context.db);
      return await stats.mostPlayedSongs(
        new SpotifyClient(parent.token),
        args.to ? new Date(args.to) : undefined,
        args.take,
        args.skip,
        args.from ? new Date(args.from) : undefined,
        context.user?.uid
      );
    },

    mostPlayedArtists: async (
      parent: GQLUser,
      args: { [key: string]: any },
      context: SContext
    ) => {
      let stats = new Stats(context.db);
      return await stats.mostPlayedArtists(
        new SpotifyClient(parent.token),
        args.to ? new Date(args.to) : undefined,
        args.take,
        args.skip,
        args.from ? new Date(args.from) : undefined,
        context.user?.uid
      );
    },
    stats: async (
      parent: GQLUser,
      args: { [key: string]: any },
      context: SContext
    ) => {
      let stats = new Stats(context.db);
      return await stats.stats(
        args.scale,
        args.steps,
        context.user?.uid,
        args.from ? new Date(args.from) : undefined,
        args.to ? new Date(args.to) : undefined
      );
    },
  },
  Query: {
    clientToken: (
      parent: any,
      args: { [key: string]: string },
      context: SContext
    ) => {
      return process.env.SPOTIFY_CLIENT_ID;
    },
    me: async (
      parent: any,
      args: { [key: string]: string },
      context: SContext
    ) => {
      if (context.user) {
        let user = await context.db.users.findFirst({
          where: {
            userid: context.user.uid,
          },
        });
        if (user) {
          return new GQLUser(user.name, user.email, user.token);
        } else {
          return new GQLError("User not in system!");
        }
      } else {
        return new GQLError("Not logged in!");
      }
    },
  },
  Mutation: {
    me: () => {
      return {
        delete: async (
          parent: any,
          context: SContext,
          info: any
        ) => {
          try {
            if (context.user) {
              context.queue.add(
                DeleteUserJob.jobName,
                new DeleteUserJob(context.user.uid)
              );
              return new GQLMessage("Started deletion!");
            } else {
              return new GQLError("Can't delete if not logged in!");
            }
          } catch (error) {
            console.error("Error creating user", error);
            return new GQLError(error.message);
          }
        },
        triggerExport: async (parent: any, context: SContext, info: any) => {
          try {
            if (context.user) {
              await context.queue.add(
                ExportMeJob.jobName,
                new ExportMeJob(context.user.uid)
              );
              return new GQLMessage(
                "Triggered export - you will receive an email when its ready!"
              );
            } else {
              return new GQLError("Can't export if not logged in!");
            }
          } catch (error) {
            console.error("Error creating user", error);
            return new GQLError(error.message);
          }
        },
      };
    },
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
