import { PrismaClient } from "@prisma/client";
import { ExpressContext } from "apollo-server-express/src/ApolloServer";
import Bull, { Queue } from "bull";
import { verify, sign } from "jsonwebtoken";
import { SpotifyClient, SpotifyTokenClient } from "../shared";
import { InitJob, RefreshTokenJob, SyncPlaysJob } from "../shared/types";
import { GQLAuthentificationResponse, GQLUser } from "./returnTypes";
const db = new PrismaClient();
const queue = new Bull("worker", {
  redis: process.env.REDIS ? process.env.REDIS : undefined,
});
export class UserTokenData {
  constructor(public uid: number, public email: string, public name: string) {}
}
export class SContext {
  constructor(
    public db: PrismaClient,
    public queue: Queue,
    public express: ExpressContext,
    public token: string,
    public user?: UserTokenData
  ) {}
}
export async function contextFunc(context: ExpressContext): Promise<SContext> {
  let auth_header = context.req.headers.authorization;
  let token = "";
  let user: UserTokenData | undefined = undefined;
  if (auth_header) {
    let parts = auth_header.split(" ");
    if (parts.length > 1 && parts[0] == "Bearer") {
      token = parts[1];
      let decoded = verify(token, process.env.JWT_SECRET as string, {
        complete: true,
      }) as { [key: string]: { [key2: string]: string } };
      user = (decoded.payload as unknown) as UserTokenData;
    }
  }

  return new SContext(db, queue, context, token, user);
}
export async function createUser(
  code: string,
  callback_uri: string,
  context: SContext
) {
  let client_id = process.env.SPOTIFY_CLIENT_ID
    ? process.env.SPOTIFY_CLIENT_ID
    : "";
  let client_secret = process.env.SPOTIFY_CLIENT_SECRET
    ? process.env.SPOTIFY_CLIENT_SECRET
    : "";
  let tokenHandler = new SpotifyTokenClient(client_id, client_secret);
  let respone = await tokenHandler.exchangeToken(code, callback_uri);
  let spotify = new SpotifyClient(respone.access_token);
  let me = await spotify.me();
  let db = context.db;
  let data = {
    token: respone.access_token,
    refreshtoken: respone.refresh_token,
    redirecturl: callback_uri,
    uri: me.uri,
    name: me.display_name,
    email: me.email,
  };
  let existingUser = await db.users.findFirst({
    where: {
      uri: me.uri,
    },
  });
  let id = null;
  if (existingUser) {
    id = (
      await db.users.update({
        data,
        where: {
          userid: existingUser.userid,
        },
        select: {
          userid: true,
        },
      })
    ).userid;
  } else {
    id = (
      await db.users.create({
        data,
        select: {
          userid: true,
        },
      })
    ).userid;

    await queue.add(
      RefreshTokenJob.jobName,
      new RefreshTokenJob(id, respone.refresh_token, client_id, client_secret),
      {
        jobId: `token:${id}`,
        repeat: {
          every: 1000*60*60, //60 min
        },
      }
    );

    await queue.add(SyncPlaysJob.jobName, new SyncPlaysJob(id), {
      jobId: `play:${id}`,
      repeat: {
        every: 1000*60*5, //10 min
      },
    });
  }

  await queue.add(InitJob.jobName, new InitJob(id, respone.access_token), {
    jobId: `init:${id}`,
  });

  let jwt_data = new UserTokenData(id, me.email, me.display_name);
  return new GQLAuthentificationResponse(
    sign(JSON.stringify(jwt_data), process.env.JWT_SECRET as string),
    new GQLUser(data.name, data.email, respone.access_token)
  );
}
