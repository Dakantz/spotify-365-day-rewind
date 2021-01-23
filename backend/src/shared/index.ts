import { Queue } from "bullmq";
import { DeleteUserJob, ExportMeJob, InitJob, MonthlyReport, RefreshTokenJob, SyncPlaysJob, WeeklyReport } from "./types";

export * from "./spotify"

export const queueNames = [
    "cleaner",
  
    DeleteUserJob.jobName,
    ExportMeJob.jobName,
    InitJob.jobName,
    MonthlyReport.jobName,
    RefreshTokenJob.jobName,
    SyncPlaysJob.jobName,
    WeeklyReport.jobName,
  ];
  export type queueMap = { [key: string]: Queue };
  export function buildQueueMap(connection: any) {
    const queues: queueMap = Object.fromEntries(
      queueNames.map((name) => [name, new Queue(name, { connection })])
    );
    return queues;
  }