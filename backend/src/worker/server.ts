import { PrismaClient } from "@prisma/client";
import Bull, { Job } from "bull";
import { SpotifyClient } from "../shared";
import { InitJob, RefreshTokenJob, SyncPlaysJob } from "../shared/types";
import { UserWorker } from "./workers";

(async () => {
  const db = new PrismaClient();
  const queue = new Bull("worker", {
    redis: {
      host:process.env.REDIS ? process.env.REDIS : undefined,
    }
  });
  const worker = new UserWorker(db, queue);
  queue.on("error", (err) => {
    console.error("error during processing:", err);
  });

  queue.on("removed", (err) => {
    console.error("removed:", err);
  });
  queue.process(InitJob.jobName, worker.processInit.bind(worker));
  queue.process(SyncPlaysJob.jobName, worker.processSync.bind(worker));
  queue.process(RefreshTokenJob.jobName, worker.processRefresh.bind(worker));

  /*
Re-adding all jobs
*/
  let repeatableJobs = await queue.getRepeatableJobs();
  for (let job of repeatableJobs) {
    try {
      await queue.removeRepeatableByKey(job.key);
    } catch (error) {
      console.warn("Failed to remove job", error);
    }
  }
  let users = await db.users.findMany();

  let client_id = process.env.SPOTIFY_CLIENT_ID
    ? process.env.SPOTIFY_CLIENT_ID
    : "";
  let client_secret = process.env.SPOTIFY_CLIENT_SECRET
    ? process.env.SPOTIFY_CLIENT_SECRET
    : "";

  for (let user of users) {
    await queue.add(
      RefreshTokenJob.jobName,
      new RefreshTokenJob(
        user.userid,
        user.refreshtoken,
        client_id,
        client_secret
      ),
      {
        jobId: `token:${user.userid}`,
      }
    );
    await queue.add(SyncPlaysJob.jobName, new SyncPlaysJob(user.userid), {
      jobId: `play:${user.userid}`,
    });
    await queue.add(
      RefreshTokenJob.jobName,
      new RefreshTokenJob(
        user.userid,
        user.refreshtoken,
        client_id,
        client_secret
      ),
      {
        jobId: `token:${user.userid}`,
        repeat: {
          every: 1000 * 60 * 60, //60 min
        },
      }
    );
    await queue.add(SyncPlaysJob.jobName, new SyncPlaysJob(user.userid), {
      jobId: `play:${user.userid}`,
      repeat: {
        every: 1000 * 60 * 5, //5 min
      },
    });
  }
  queue.process("cleaner", 1, worker.clearJobs.bind(worker));
  await queue.add("cleaner");
  await queue.add(
    "cleaner",
    {},
    {
      repeat: {
        every: 6000000,
      },
    }
  );
  console.log("Ready to accept jobs");
})()
  .then(() => {
    console.log("Exiting");
  })
  .catch((e) => {
    console.error("Error start job processor", e);
  });
