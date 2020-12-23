import { PrismaClient } from "@prisma/client";
import { Job } from "bull";
import { SpotifyClient } from "../shared";
import { SpotifySyncHelper } from "../shared/helpers";
import { InitJob, RefreshTokenJob, SyncPlaysJob } from "../shared/types";

export class UserWorker {
  constructor(public db: PrismaClient) {}
  async processInit(job: Job<InitJob>) {
    console.log("Starting init of", job.data.userId);
    let data = job.data;
    let spotify = new SpotifyClient(data.token);
    let recently_played = null;
    let helper = new SpotifySyncHelper(this.db, data.token);
    do {
      let query = { before: null };
      if (recently_played?.next) {
        query.before = recently_played.cursors.before;
      }
      recently_played = await spotify.recentListened(query);
      for (let play in recently_played.items) {
        let play_c = play as any;
        let trackId = await helper.addTrack((play_c as any).track);
        this.db.plays.create({
          data: {
            time: play_c.timestamp,
            songs: {
              connect: {
                songid: trackId,
              },
            },
            users: {
              connect: {
                userid: job.data.userId,
              },
            },
          },
        });
      }
    } while (recently_played?.next);
  }
  async processSync(job: Job<SyncPlaysJob>) {
    //TODO
  }
  async processRefresh(job: Job<RefreshTokenJob>) {
    //TODO
  }
}
