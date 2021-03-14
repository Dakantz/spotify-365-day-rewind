import { users } from "@prisma/client";
import { IResolvers } from "graphql-tools";
import { SpotifyClient } from "../shared";
import { DeleteUserJob, ExportMeJob } from "../shared/types";
import { createUser, SContext } from "./auth";
import {
  GeneralUser,
  GQLError,
  GQLMessage,
  GQLMeUser,
  GQLPublicUser,
  GQLSSong,
  GQLStats,
} from "../shared/returnTypes";
import { Stats } from "../shared/statistics";
import { PlaylistCreator } from "../shared/playlistCreator";
export const resolvers = {
  Song: {
    artists: async (parent: GQLSSong, args: any, context: SContext) => {
      let artists = await context.db.songs
        .findFirst({
          where: {
            uri: {
              contains: parent.id,
            },
          },
          select: {
            artists: true,
          },
        })
        .artists();
      return [artists];
    },
  },
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
  MeUser: {
    previewPlaylist: async (
      parent: GQLMeUser,
      args: { [key: string]: any },
      context: SContext
    ) => {
      let playlistCreator = new PlaylistCreator(
        new SpotifyClient(parent.auth_token),
        context.db,
        context.queues
      );
      return await playlistCreator.songsForPlaylist(
        args.params,
        context.user?.uid as number
      );
    },
    stats: async (
      parent: GQLMeUser,
      args: { [key: string]: any },
      context: SContext
    ) => {
      let stats = new Stats(context.db);
      return await stats.stats(
        args.scale,
        args.steps,
        args.global ? undefined : context.user?.uid,
        args.from ? new Date(args.from) : undefined,
        args.to ? new Date(args.to) : undefined
      );
    },
    async reportIntervals(
      parent: GQLMeUser,
      args: { [key: string]: any },
      context: SContext
    ) {
      let intervals: string[] = [];
      let user = await context.db.users.findFirst({
        where: {
          userid: context.user?.uid,
        },
      });
      if (user?.report_monthly) {
        intervals.push("MONTH");
      }
      if (user?.report_weekly) {
        intervals.push("WEEK");
      }
      return intervals;
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
          return new GQLMeUser(
            user.uri.split(":")[2],
            user.name,
            user.email,
            user.token
          );
        } else {
          return new GQLError("User not in system!");
        }
      } else {
        return new GQLError("Not logged in!");
      }
    },
    leaderboard: async (
      parent: any,
      args: { [key: string]: string },
      context: SContext
    ) => {
      if (context.spotifyToken) {
        let to = args.to ? new Date(args.to) : new Date();
        let from = new Date(args.from);
        let take = args.take ? parseInt(args.take) : 20;
        let skip = args.skip ? parseInt(args.skip) : 0;
        return {
          entries: await new Stats(context.db).leaderboard(
            to,
            from,
            context.spotifyToken,
            take,
            skip
          ),
        };
      } else {
        return new GQLError("Can't display leaderboard if not logged idn!");
      }
    },
    findUser: async (
      parent: any,
      args: { [key: string]: string },
      context: SContext
    ) => {
      if (context.spotifyToken) {
        return (
          await context.db.users.findMany({
            where: {
              name: {
                contains: args.query,
              },
              allow_public_display: true,
            },
          })
        ).map((user) => {
          return new GQLPublicUser(
            user.uri.split(":")[1],
            user.name,
            context.spotifyToken as string
          );
        });
      } else {
        return new GQLError("Can't display leaderboard if not logged idn!");
      }
    },
  },
  Mutation: {
    me: () => {
      return {
        async setReportInterval(
          args: { [key: string]: string | boolean },
          context: SContext,
          info: any
        ) {
          if (context.user) {
            try {
              switch (args.scale) {
                case "MONTH":
                  await context.db.users.update({
                    where: { userid: context.user.uid },
                    data: {
                      report_monthly:
                        (args.val as boolean) || args.val == "true",
                    },
                  });
                  break;
                case "WEEK":
                  await context.db.users.update({
                    where: { userid: context.user.uid },
                    data: {
                      report_weekly:
                        (args.val as boolean) || args.val == "true",
                    },
                  });
                  break;
                default:
                  return new GQLError(
                    "Other granularity currently unsupported!"
                  );
              }
              return new GQLMessage("Success!");
            } catch (e) {
              console.error("Error during update on report", e);
            }
          } else {
            return new GQLError("Must be logged in!");
          }
        },
        delete: async (parent: any, context: SContext, info: any) => {
          try {
            if (context.user) {
              await context.queues[DeleteUserJob.jobName].add(
                `delete-${context.user.uid}`,
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
              await context.queues[ExportMeJob.jobName].add(
                `delete-${context.user.uid}`,
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
