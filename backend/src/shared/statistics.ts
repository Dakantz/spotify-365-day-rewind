import { PrismaClient } from "@prisma/client";
import { SpotifyClient } from ".";
import {
  GQLArtist,
  GQLArtistStats,
  GQLLeaderboardEntry,
  GQLPublicUser,
  GQLSongStats,
  GQLSSong,
  GQLStatPoint,
  GQLStats,
  ScaleSteps,
} from "./returnTypes";

export class Stats {
  constructor(private db: PrismaClient) {}

  private msFromScale(scale: ScaleSteps) {
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
  private msFromSteps(scale: ScaleSteps, wantedSteps: number) {
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
        toFixed.getTime() - this.msFromSteps(scale, wantedSteps)
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
    let query = `
    SELECT 
		count(p.playid) as plays,
       sum(s.duration_ms) / (1000 * 60) as playtime,
       timesub.generate_series as time_from,
       timesub.generate_series +  INTERVAL '1 ${parent.scale.toLowerCase()}' as time_to
       
       FROM (SELECT *
      FROM generate_series(DATE_TRUNC('${parent.scale.toLowerCase()}', TIMESTAMP '${
      parent.from
    }'),
      DATE_TRUNC('${parent.scale.toLowerCase()}', TIMESTAMP '${
      parent.to
    }'), INTERVAL '1 ${parent.scale.toLowerCase()}' )) as timesub

    LEFT OUTER JOIN plays p on p.time BETWEEN timesub.generate_series AND timesub.generate_series + INTERVAL '1 ${parent.scale.toLowerCase()}' ${
      parent.userId ? " AND p.userid = " + parent.userId : ""
    }
    LEFT OUTER JOIN songs s on s.songid = p.songid
GROUP BY timesub.generate_series
ORDER BY timesub.generate_series DESC
        `;
    let data = await this.db.$queryRaw(query);

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
    let data = await this.db.$queryRaw(`
SELECT count(*) as plays, sum(s.duration_ms) / (1000 * 60) as playtime
FROM plays
         LEFT JOIN songs s on s.songid = plays.songid
WHERE ${parent.userId ? "userid = " + parent.userId + " AND" : ""}
 plays.time BETWEEN '${parent.from}' AND '${parent.to}'
    `);

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
    let data = await this.db.$queryRaw(`
    SELECT count(*) as plays, sum(s.duration_ms)/(1000*60) as playtime, a.name, a.uri FROM plays LEFT JOIN songs s on s.songid = plays.songid
LEFT JOIN artists a on a.artistid = s.artistid
WHERE ${userId ? "userid = " + userId + " AND" : ""}
${
  from
    ? `plays.time BETWEEN '${from.toISOString()}' AND '${to.toISOString()}'`
    : `plays.time <'${to.toISOString()}'`
}
GROUP BY a.artistid
ORDER BY plays DESC, playtime DESC
LIMIT ${take}
OFFSET ${skip}`);
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
    let query = `
    SELECT count(*) as plays, sum(s.duration_ms)/(1000*60) as playtime, s.name, s.uri FROM plays 
    LEFT JOIN songs s on s.songid = plays.songid
WHERE ${userId ? "userid = " + userId + " AND" : ""}
${
  from
    ? `plays.time BETWEEN '${from.toISOString()}' AND '${to.toISOString()}'`
    : `plays.time <'${to.toISOString()}'`
}
GROUP BY s.songid
ORDER BY plays DESC
LIMIT ${take}
OFFSET ${skip}`;
    let data = await this.db.$queryRaw(query);
    let songs =
      data.length > 0
        ? await spotify.tracks(data.map((p: any) => p.uri.split(":")[2]))
        : [];
    return songs.map((song: any, index: number) => {
      return new GQLSongStats(
        new GQLSSong(song.id, song.name, song.album.images,song.uri),
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
    skip?: number
  ): Promise<GQLLeaderboardEntry[]> {
    let leaders = await this.db.$queryRaw`
    SELECT u.userid as id,
		count(p.playid) as plays,
       sum(s.duration_ms) / (1000 * 60) as playtime
      FROM users u
    LEFT OUTER JOIN plays p on p.userid = u.userid 
    LEFT OUTER JOIN songs s on s.songid = p.songid
	WHERE  p."time" BETWEEN '${from.toISOString()}' AND '${to.toISOString()}'
	AND u.allow_public_display IS TRUE
GROUP BY u.userid
ORDER BY playtime DESC
LIMIT ${take}
OFFSET ${skip}
    `;
    let users = await this.db.users.findMany({
      where: { userid: { in: leaders.map((leader: any) => leader.id) } },
    });

    let entries: GQLLeaderboardEntry[] = users.map((user, i) => {
      return new GQLLeaderboardEntry(
        new GQLPublicUser(user.uri.split(":")[1], user.name, token),
        leaders[i].playtime,
        leaders[i].plays
      );
    });
    return leaders;
  }
}
