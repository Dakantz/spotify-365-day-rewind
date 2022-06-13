import { PrismaClient } from "@prisma/client";
import { Job, Queue, QueueScheduler, Worker } from "bullmq";
import IORedis from "ioredis";
import { buildQueueMap, SpotifyClient } from "../shared";
import { intervalToCron } from "../shared/playlistCreator";
import {
    DeleteUserJob,
    ExportMeJob,
    InitJob,
    MonthlyReport,
    PlaylistRefresh,
    RefreshTokenJob,
    SyncPlaysJob,
    WeeklyReport,
} from "../shared/types";
import { UserWorker } from "./workers";
(async () => {
    const connection = new IORedis({
        host: process.env.REDIS ? process.env.REDIS : "localhost",
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    });
    connection.setMaxListeners(30);
    const db = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
    });
    const worker = new UserWorker(db);

    let workers = [
        new Worker("cleaner", worker.clearJobs.bind(worker), { connection }),
        new Worker(InitJob.jobName, worker.processInit.bind(worker), {
            connection,
        }),
        new Worker(SyncPlaysJob.jobName, worker.processSync.bind(worker), {
            connection,
        }),
        new Worker(RefreshTokenJob.jobName, worker.processRefresh.bind(worker), {
            connection,
        }),
        new Worker(ExportMeJob.jobName, worker.processExport.bind(worker), {
            connection,
        }),
        new Worker(DeleteUserJob.jobName, worker.processDeletion.bind(worker), {
            connection,
        }),
        new Worker(WeeklyReport.jobName, worker.processWeeklyReport.bind(worker), {
            connection,
        }),
        new Worker(
            MonthlyReport.jobName,
            worker.processMonthlyReport.bind(worker),
            { connection }
        ),
        new Worker(
            PlaylistRefresh.jobName,
            worker.processPlaylistRefresh.bind(worker),
            {
                connection,
            }
        ),
    ];
    const schedulers = [
        new QueueScheduler("cleaner", { connection }),

        new QueueScheduler(InitJob.jobName, {
            connection,
        }),
        new QueueScheduler(SyncPlaysJob.jobName, {
            connection,
        }),
        new QueueScheduler(
            RefreshTokenJob.jobName,

            { connection }
        ),
        new QueueScheduler(ExportMeJob.jobName, {
            connection,
        }),
        new QueueScheduler(DeleteUserJob.jobName, { connection }),
        new QueueScheduler(WeeklyReport.jobName, { connection }),
        new QueueScheduler(MonthlyReport.jobName, { connection }),
        new QueueScheduler(PlaylistRefresh.jobName, { connection }),
    ];

    worker.workers = workers;

    if (!(await connection.get("jobs-initialized"))) {
        /*
      Re-adding all jobs
      */
        console.log("Initializing jobs!");
        let queues = buildQueueMap(connection);
        for (let q in queues) {
            let queue = queues[q];
            let repeatableJobs = await queue.getRepeatableJobs();
            for (let job of repeatableJobs) {
                try {
                    await queue.removeRepeatableByKey(job.key);
                } catch (error) {
                    console.warn("Failed to remove job", error);
                }
            }
        }
        let users = await db.users.findMany();

        let client_id = process.env.SPOTIFY_CLIENT_ID
            ? process.env.SPOTIFY_CLIENT_ID
            : "";
        let client_secret = process.env.SPOTIFY_CLIENT_SECRET
            ? process.env.SPOTIFY_CLIENT_SECRET
            : "";

        await queues[WeeklyReport.jobName].add(
            "default",
            {},
            {
                repeat: {
                    cron: "0 0 * * Sun",
                },
            }
        );
        await queues[MonthlyReport.jobName].add(
            "default",
            {},
            {
                repeat: {
                    cron: "0 0 1 * *",
                },
            }
        );

        for (let user of users) {
            await queues[RefreshTokenJob.jobName].add(
                `refresh-${user.userid}-startup`,
                new RefreshTokenJob(
                    user.userid,
                    user.refreshtoken,
                    client_id,
                    client_secret
                ),
                {}
            );
            await queues[SyncPlaysJob.jobName].add(
                `sync-${user.userid}-startup`,
                new SyncPlaysJob(user.userid),
                {
                    jobId: `play:${user.userid}`,
                }
            );
            await queues[RefreshTokenJob.jobName].add(
                `refresh-${user.userid}`,
                new RefreshTokenJob(
                    user.userid,
                    user.refreshtoken,
                    client_id,
                    client_secret
                ),
                {
                    repeat: {
                        every: 1000 * 60 * 60, //60 min
                    },
                }
            );
            await queues[SyncPlaysJob.jobName].add(
                `sync-${user.userid}`,
                new SyncPlaysJob(user.userid),
                {
                    jobId: `play:${user.userid}`,
                    repeat: {
                        every: 1000 * 60 * 5, //5 min
                    },
                }
            );
        }
        let playlists = await db.playlists.findMany();
        for (let playlist of playlists) {
            await queues[PlaylistRefresh.jobName].add(
                `refresh-${playlist.playlistid}`,
                new PlaylistRefresh(playlist.userid, playlist.playlistid),
                {
                    repeat: {
                        cron: intervalToCron((playlist.parameters as any).refreshEvery), //5 min
                    },
                }
            );
            await queues[PlaylistRefresh.jobName].add(
                `refresh-${playlist.playlistid}`,
                new PlaylistRefresh(playlist.userid, playlist.playlistid)
            );
        }
        await queues["cleaner"].add("cleaner-startup", {}, {});
        await queues["cleaner"].add(
            "cleaner-repeat",
            {},
            {
                repeat: {
                    every: 6000000,
                },
            }
        );
        console.log("Added all jobs, next startup *won't* do that!");
        await connection.set("jobs-initialized", new Date().toISOString());
    }

    console.log("Ready to accept jobs");
})()
    .then(() => {
        console.log("Exiting");
    })
    .catch((e) => {
        console.error("Error start job processor", e);
    });
