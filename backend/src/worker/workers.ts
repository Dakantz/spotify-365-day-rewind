import { PrismaClient } from "@prisma/client";
import { Job, Queue } from "bull";
import { fixSchemaAst } from "graphql-tools";
import { SpotifyClient, SpotifyTokenClient } from "../shared";
import { Emailer } from "../shared/emailer";
import { SpotifySyncHelper } from "../shared/helpers";
import { GQLStats } from "../shared/returnTypes";
import { Stats } from "../shared/statistics";
import * as fs from "fs";
import * as path from "path";
import * as csv from "csv-stringify";
import * as archiver from "archiver";
import {
  DeleteUserJob,
  ExportMeJob,
  InitJob,
  RefreshTokenJob,
  SyncPlaysJob,
} from "../shared/types";

export class UserWorker {
  private mailer: Emailer;
  constructor(public db: PrismaClient, private queue: Queue) {
    this.mailer = new Emailer(
      {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
        secure: true, // use TLS
        auth: {
          user: process.env.SMTP_USER ? process.env.SMTP_USER : "",
          pass: process.env.SMTP_PASS ? process.env.SMTP_PASS : "",
        },
        tls: {
          // do not fail on invalid certs
          rejectUnauthorized: false,
        },
      },
      {
        address: process.env.SMTP_ADRESS ? process.env.SMTP_ADRESS : "",
        name: process.env.SMTP_NAME ? process.env.SMTP_NAME : "",
      }
    );
  }
  async clearJobs() {
    console.log("Deleting old jobs:");
    let cleaned = await this.queue.clean(60000, "completed");
    let cleaned_failed = await this.queue.clean(60000, "failed");
    for (const job of [...cleaned, ...cleaned_failed]) {
      console.log("deleted ", job);
    }
    console.log("Deleted old jobs...");
  }
  async addPlayed(items: any[], helper: SpotifySyncHelper, userId: number) {
    for (let play of items) {
      console.log("Adding old play:", play);
      let play_c = play as any;
      let trackId = await helper.addTrack((play_c as any).track);
      try {
        await this.db.plays.create({
          data: {
            time: play_c.played_at,
            songs: {
              connect: {
                songid: trackId,
              },
            },
            users: {
              connect: {
                userid: userId,
              },
            },
          },
        });
      } catch (error) {
        console.warn(
          "Error during adding of play, may arise from double adding",
          error
        );
      }
    }
  }
  async processInit(job: Job<InitJob>) {
    try {
      console.log("Starting init of", job.data.userId);
      let data = job.data;
      let spotify = new SpotifyClient(data.token);
      let recently_played = null;
      let helper = new SpotifySyncHelper(this.db, data.token);
      do {
        let query = { before: undefined };
        if (recently_played?.next) {
          query.before = recently_played.cursors.before;
        } else {
          delete query.before;
        }
        recently_played = await spotify.recentListened(query);
        this.addPlayed(recently_played.items, helper, job.data.userId);
      } while (recently_played?.next);
    } catch (e) {
      console.error("error during user init", e);
      throw e;
    }
  }
  async processSync(job: Job<SyncPlaysJob>) {
    let user = await this.db.users.findFirst({
      where: {
        userid: job.data.userId,
      },
    });
    if (user) {
      console.log(
        "Starting sync of",
        job.data.userId,
        "on",
        new Date().toISOString()
      );
      let lastPlay = await this.db.$queryRaw(
        `SELECT max(time) FROM plays as p WHERE p.userId=${job.data.userId}`
      );
      let after = null;
      if (lastPlay.length != 0) {
        let timestamp = new Date(lastPlay[0].max);
        after = timestamp.getTime();
      }
      let query = { after: undefined };
      if (after) {
        query.after = after as any;
      } else {
        delete query.after;
      }
      let user = await this.db.users.findFirst({
        where: {
          userid: job.data.userId,
        },
      });
      if (user) {
        let spotify = new SpotifyClient(user.token);
        let helper = new SpotifySyncHelper(this.db, user.token);
        let recently_played = await spotify.recentListened(query);
        this.addPlayed(recently_played.items, helper, job.data.userId);
      }
    }
  }
  async processRefresh(job: Job<RefreshTokenJob>) {
    console.log(
      "Starting refresh of",
      job.data.userId,
      "on",
      new Date().toISOString()
    );
    let user = await this.db.users.findFirst({
      where: {
        userid: job.data.userId,
      },
    });
    if (user) {
      let spotify = new SpotifyTokenClient(
        job.data.client_id,
        job.data.client_secret
      );
      let refresh = await spotify.refreshToken(user.refreshtoken);
      await this.db.users.update({
        data: {
          token: refresh.access_token,
        },
        where: {
          userid: job.data.userId,
        },
      });
    }
  }
  async processDeletion(job: Job<DeleteUserJob>) {
    try {
      let user = await this.db.users.findFirst({
        where: {
          userid: job.data.userId,
        },
      });
      if (user) {
        console.log("Deleting ", user.name);
        let statsEngine = new Stats(this.db);
        let stats = await statsEngine.total(
          await statsEngine.stats(
            "MONTH",
            36,
            user.userid,
            undefined,
            undefined
          )
        );

        await this.db.plays.deleteMany({
          where: {
            userid: user?.userid,
          },
        });
        await this.db.users.delete({
          where: {
            userid: user?.userid,
          },
        });
        await this.mailer.sendMail(
          user.name,
          user.email,
          "[365 days of rewind] Deletion :(",
          "deletion.html",
          {
            user,
            stats,
          }
        );
      } else {
        console.log("User to delete not found...");
      }
    } catch (e) {
      console.error("error during user delete", e);
      throw e;
    }
  }
  async processExport(job: Job<ExportMeJob>) {
    try {
      let user = await this.db.users.findFirst({
        where: {
          userid: job.data.userId,
        },
      });
      if (user) {
        console.log("Exporting ", user.name);
        let statsEngine = new Stats(this.db);
        let dir = fs.mkdtempSync(`export-${user.userid}`);
        let plays = await this.db.plays.findMany({
          where: {
            userid: user.userid,
          },
          select: {
            time: true,
            songid: true,
            songs: {
              select: {
                name: true,
                explicit: true,
                duration_ms: true,
                albums: {
                  select: {
                    uri: true,
                    name: true,
                  },
                },
                artists: {
                  select: {
                    uri: true,
                    name: true,
                  },
                },
              },
            },
          },
        });
        let playRows = plays.map((play) => {
          return {
            time: play.time,
            songid: play.songid,
            song: play.songs.name,
            explicit: play.songs.explicit,
            duration: play.songs.duration_ms,
            artistid: play.songs.artists.uri,
            artist: play.songs.artists.name,
            albumid: play.songs.albums.uri,
            album: play.songs.albums.name,
          };
        });
        let csvWriter = new csv.Stringifier({
          header: true,
        });
        let playsPath = path.join(dir, "plays.csv");
        let ofStream = fs.createWriteStream(playsPath);
        csvWriter.pipe(ofStream);
        for (let row of playRows) {
          csvWriter.write(row);
        }
        ofStream.close();
        // CSV written

        //write info about user

        let userPath = path.join(dir, "user.json");
        fs.writeFileSync(
          userPath,
          JSON.stringify({
            user,
          })
        );
        let zipPath = path.join(dir, "export.zip");
        const output = fs.createWriteStream(zipPath);
        const archive = archiver.create("zip", {
          zlib: { level: 9 }, // Sets the compression level.
        });
        archive.pipe(output);
        archive.append(fs.createReadStream(playsPath), { name: "plays.csv" });
        archive.append(fs.createReadStream(userPath), { name: "user.json" });
        await archive.finalize();

        await this.mailer.sendMail(
          user.name,
          user.email,
          "[365 days of rewind] Export of your activity",
          "export.html",
          { user },
          [{ path: zipPath }]
        );
        console.log("Export finished!");
        console.log("Cleaning up:");
        fs.rmdirSync(dir);
        console.log("Deleted temp dir", dir);
      } else {
        console.log("User to export not found...");
      }
    } catch (e) {
      console.error("error during user export", e);
      throw e;
    }
  }
}
