import { Prisma, PrismaClient, users } from "@prisma/client";
import { SpotifyClient } from ".";
import {
    GQLArtist,
    GQLArtistStats,
    GQLLeaderboardEntry,
    GQLMeUser,
    GQLPublicUser,
    GQLSongStats,
    GQLSSong,
    GQLStatPoint,
    GQLStats,
    ScaleSteps,
} from "./returnTypes";

export class Stats {
    constructor(private db: PrismaClient) { }
    public async songsFromUris(uris: string[], spotify: SpotifyClient): Promise<GQLSSong[]> {
        if (uris.length > 50) {
            uris.length = 50;
        }
        let songs =
            uris.length > 0
                ? await spotify.tracks(uris.map((p: any) => p.split(":")[2]))
                : [];
        return songs.map((song: any, index: number) => {
            return new GQLSSong(song.id, song.name, song.album.images, song.uri)
        });
    }
    public async recentlyPlayedSongs(take: number, skip: number, user: GQLMeUser, userId: number) {
        let intervals: string[] = [];
        let plays = await this.db.plays.findMany({
            where: {
                userid: userId,
            },
            skip: skip,
            take: take > 50 ? 50 : take,
            orderBy: {
                time: "desc"
            },
            include: {
                songs: {
                    select: {
                        uri: true
                    }
                }
            }
        });
        let client = new SpotifyClient(user.auth_token)
        let songs = await this.songsFromUris(plays.map(p => p.songs.uri), client);
        return songs;
    }
    public static msFromScale(scale: ScaleSteps) {
        let scaleSize = 0;
        switch (scale) {
            case "HOUR":
                scaleSize = 1000 * 60 * 60;
                break;
            case "DAY":
            case "DOW":
                scaleSize = 1000 * 60 * 60 * 24;
                break;
            case "MONTH":
                scaleSize = 1000 * 60 * 60 * 24 * 31;
                break;
            case "WEEK":
                scaleSize = 1000 * 60 * 60 * 24 * 7;
                break;
        }
        return scaleSize;
    }
    public static msFromSteps(scale: ScaleSteps, wantedSteps: number) {
        return wantedSteps * this.msFromScale(scale);
    }
    public async stats(
        scale: ScaleSteps,
        wantedSteps: number,
        userId?: number,
        from?: Date,
        to?: Date
    ) {
        let toFixed = to ? to : new Date();

        let fromFixed = new Date();
        if (from) {
            fromFixed = from;
        } else {
            fromFixed = new Date(
                toFixed.getTime() - Stats.msFromSteps(scale, wantedSteps)
            );
        }
        return new GQLStats(
            scale,
            fromFixed.toISOString(),
            toFixed.toISOString(),
            scale,
            wantedSteps,
            userId
        );
    }
    public async steps(parent: GQLStats) {
        let data: any[];
        try {
            data = await this.db.$queryRaw`
    SELECT 
		count(p.playid) as plays,
       sum(s.duration_ms) / (1000 * 60) as playtime,
       timesub.generate_series as time_from,
       timesub.generate_series +  ${'1 ' + parent.scale.toLowerCase()}::TEXT::INTERVAL  as time_to
       
       FROM (SELECT *
      FROM generate_series(DATE_TRUNC(${parent.scale.toLowerCase()}, ${parent.from}::TEXT::TIMESTAMP),
      DATE_TRUNC(${parent.scale.toLowerCase()},   ${parent.to}::TEXT::TIMESTAMP),  ${'1 ' + parent.scale.toLowerCase()}::TEXT::INTERVAL  )) as timesub

    LEFT OUTER JOIN plays p on p.time BETWEEN timesub.generate_series AND timesub.generate_series + ${'1 ' + parent.scale.toLowerCase()}::TEXT::INTERVAL  ${parent.userId ? Prisma.sql`AND p.userid = ${parent.userId}` : Prisma.empty
                }
    LEFT OUTER JOIN songs s on s.songid = p.songid
GROUP BY timesub.generate_series
ORDER BY timesub.generate_series DESC
        `;

        } catch (err) {
            throw err
        }
        let steps: GQLStatPoint[] = [];
        for (let point of data) {
            steps.push(
                new GQLStatPoint(
                    point.playtime ? point.playtime : 0,
                    point.plays ? point.plays : 0,
                    point.time_from,
                    point.time_from,
                    point.time_to,
                    parent.userId
                )
            );
        }
        return steps;
    }

    public async total(parent: GQLStats) {

        let data: any[]
        try {
            data = await this.db.$queryRaw`
SELECT count(*) as plays, sum(s.duration_ms) / (1000 * 60) as playtime
FROM plays
         LEFT JOIN songs s on s.songid = plays.songid
WHERE ${parent.userId ? Prisma.sql`userid = ${parent.userId} AND` : Prisma.empty}
 plays.time BETWEEN ${new Date(parent.from)} AND ${new Date(parent.to)}
    `;
        } catch (err) {
            throw err
        }
        if (data.length > 0) {
            let point = data[0];
            return new GQLStatPoint(
                point.playtime ? point.playtime : 0,
                point.plays,
                point.time ? point.time : 0,
                undefined,
                undefined,
                parent.userId
            );
        } else {
            return new GQLStatPoint(0, 0, "", undefined, undefined, parent.userId);
        }
    }
    public async mostPlayedArtists(
        spotify: SpotifyClient,
        to: Date = new Date(),
        take: number = 20,
        skip: number = 0,
        from?: Date,
        userId?: number
    ): Promise<GQLArtistStats[]> {
        if (take > 50) {
            take = 50;
        }
        let data: any[]
        try {
            data = await this.db.$queryRaw`
        SELECT count(*) as plays, sum(s.duration_ms)/(1000*60) as playtime, a.name, a.uri FROM plays LEFT JOIN songs s on s.songid = plays.songid
    LEFT JOIN artists a on a.artistid = s.artistid
    WHERE ${userId ? Prisma.sql`userid = ${userId}  AND` : Prisma.empty}
    ${from
                    ? Prisma.sql`plays.time BETWEEN ${from} AND ${to}`
                    : Prisma.sql`plays.time <${to}`
                }
    GROUP BY a.artistid
    ORDER BY  playtime DESC, plays DESC
    LIMIT ${take}
    OFFSET ${skip}`;
        } catch (error) {
            throw error
        }
        let artists = await spotify.artists(
            data.map((p: any) => p.uri.split(":")[2])
        );
        return artists.map((artist: any, index: number) => {
            return new GQLArtistStats(
                new GQLArtist(artist.id, artist.name, artist.images),
                data[index].playtime,
                data[index].plays
            );
        });
    }

    public async mostPlayedSongs(
        spotify: SpotifyClient,
        to: Date = new Date(),
        take: number = 20,
        skip: number = 0,
        from?: Date,
        userId?: number
    ): Promise<GQLSongStats[]> {
        if (take > 50) {
            take = 50;
        }
        let data: any[];
        try {
            data = await this.db.$queryRaw`
        SELECT count(*) as plays, sum(s.duration_ms)/(1000*60) as playtime, s.name, s.uri FROM plays 
        LEFT JOIN songs s on s.songid = plays.songid
    WHERE ${userId ? Prisma.sql`userid = ${userId} AND` : Prisma.empty}
    ${from
                    ? Prisma.sql`plays.time BETWEEN ${from} AND ${to}`
                    : Prisma.sql`plays.time <${to}`
                }
    GROUP BY s.songid
    ORDER BY  playtime DESC, plays DESC
    LIMIT ${take}
    OFFSET ${skip}`;
        } catch (error) {
            throw error;
        }
        let songs =
            data.length > 0
                ? await spotify.tracks(data.map((p: any) => p.uri.split(":")[2]))
                : [];
        return songs.map((song: any, index: number) => {
            return new GQLSongStats(
                new GQLSSong(song.id, song.name, song.album.images, song.uri),
                data[index].playtime,
                data[index].plays
            );
        });
    }
    public async leaderboard(
        to: Date,
        from: Date,
        token: string,
        take?: number,
        skip?: number,
        artistId?: string
    ): Promise<GQLLeaderboardEntry[]> {
        let leaders: any[];
        if (artistId) {
            let artistUri = `spotify:artist:${artistId}`
            leaders = await this.db.$queryRaw`
      SELECT u.userid as id,
      count(p.playid) as plays,
         sum(s.duration_ms) / (1000 * 60) as playtime
        FROM users u
      LEFT OUTER JOIN plays p on p.userid = u.userid 
      LEFT OUTER JOIN songs s on s.songid = p.songid
      LEFT OUTER JOIN artists a on a.artistid = s.artistid
      WHERE  p."time" BETWEEN ${new Date(from)}  AND ${new Date(to)}
    AND u.allow_public_display IS TRUE AND a.uri=${artistUri}
  GROUP BY u.userid
  ORDER BY playtime DESC, plays DESC
  LIMIT ${take}
  OFFSET ${skip}`;
        } else {
            leaders = await this.db.$queryRaw`
      SELECT u.userid as id,
      count(p.playid) as plays,
         sum(s.duration_ms) / (1000 * 60) as playtime
        FROM users u
      LEFT OUTER JOIN plays p on p.userid = u.userid 
      LEFT OUTER JOIN songs s on s.songid = p.songid
      LEFT OUTER JOIN artists a on a.artistid = s.artistid
    WHERE  p."time" BETWEEN ${new Date(from)}  AND ${new Date(to)}
    AND u.allow_public_display IS TRUE 
  GROUP BY u.userid
  ORDER BY playtime DESC, plays DESC
  LIMIT ${take}
  OFFSET ${skip}`;
        }

        let users = await this.db.users.findMany({
            where: { userid: { in: leaders.map((leader: any) => leader.id) } },
        });

        let entries: GQLLeaderboardEntry[] = leaders.map(entry => {
            let user = users.find(u => u.userid == entry.id) as users
            return new GQLLeaderboardEntry(
                new GQLPublicUser(user.uri.split(":")[2], user.name, token),
                entry.playtime,
                entry.plays
            );
        });
        return entries;
    }
}
