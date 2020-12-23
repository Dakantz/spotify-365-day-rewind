import { PrismaClient } from "@prisma/client";
import Bull, { Job } from "bull";
import { SpotifyClient } from "../shared";
import { InitJob, RefreshTokenJob, SyncPlaysJob } from "../shared/types";
import { UserWorker } from "./workers";

(async () => {
  const db = new PrismaClient();
  const queue = new Bull("worker");
  const worker = new UserWorker(db);
  await queue.process(InitJob.jobName, worker.processInit);
  await queue.process(RefreshTokenJob.jobName, worker.processSync);
  await queue.process(SyncPlaysJob.jobName, worker.processRefresh);
  console.log("Ready to accept jobs");
})()
  .then(() => {
    console.log("Exiting");
  })
  .catch((e) => {
    console.error("Error start job processor", e);
  });
