import { PrismaClient } from "@prisma/client";
import Bull, { Job } from "bull";
import { SpotifyClient } from "../shared";
import { InitJob, RefreshTokenJob, SyncPlaysJob } from "../shared/types";
import { UserWorker } from "./workers";

(async () => {
  const db = new PrismaClient();
  const queue = new Bull("worker", {
    redis: process.env.REDIS ? process.env.REDIS : undefined,
  });
  const worker = new UserWorker(db);
  queue.on("error", (err) => {
    console.error("error during processing:", err);
  });

  queue.on("removed", (err) => {
    console.error("removed:", err);
  });
  queue.process(InitJob.jobName, worker.processInit.bind(worker));
  queue.process(SyncPlaysJob.jobName, worker.processSync.bind(worker));
  queue.process(RefreshTokenJob.jobName, worker.processRefresh.bind(worker));
  console.log("Ready to accept jobs");
})()
  .then(() => {
    console.log("Exiting");
  })
  .catch((e) => {
    console.error("Error start job processor", e);
  });
