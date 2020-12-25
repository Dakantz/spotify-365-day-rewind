import { PrismaClient } from "@prisma/client";
import { SpotifyClient } from "../shared";
import {
  GQLArtist,
  GQLArtistStats,
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
        scaleSize = 1000 * 60 * 60 * 7;
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
      wantedSteps,
      userId
    );
  }
  public async steps(parent: GQLStats) {
    let query = `
    SELECT count(*) as plays, sum(s.duration_ms) / (1000 * 60) as playtime, extract(${
      parent.scale
    } FROM plays.time) as timemeaser
    FROM plays
             LEFT JOIN songs s on s.songid = plays.songid
    WHERE ${parent.userId ? "userid = " + parent.userId + " AND" : ""}
     plays.time BETWEEN '${parent.from}' AND '${parent.to}'
    GROUP BY timemeaser 
        `;
    let data = await this.db.$queryRaw(query);

    let steps: GQLStatPoint[] = [];
    for (let point of data) {
      steps.push(
        new GQLStatPoint(
          point.playtime,
          point.plays,
          point.timemeaser,
          undefined,
          undefined,
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
      return new GQLStatPoint(0, 0, -1, undefined, undefined, parent.userId);
    }
  }
  public async mostPlayedArtists(
    spotify: SpotifyClient,
    to: Date = new Date(),
    take: number = 20,
    skip: number = 0,
    from?: Date,
    userId?: number
  ) {
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
ORDER BY plays DESC
LIMIT ${take}
OFFSET ${skip}`);
    let artists = await spotify.artists(
      data.map((p: any) => p.uri.split(":")[2])
    );
    return artists.map((artist: any, index: number) => {
      return new GQLArtistStats(
        new GQLArtist(artist.name, artist.images),
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
  ) {
    if (take > 50) {
      take = 50;
    }
    let data = await this.db.$queryRaw(`
    SELECT count(*) as plays, sum(s.duration_ms)/(1000*60) as playtime, s.name, s.uri FROM plays 
    LEFT JOIN songs s on s.songid = plays.songid
WHERE ${userId ? "userid = " + userId + " AND" : ""}
${
  from
    ? `plays.time BETWEEN '${from.toISOString()}' AND '${to.toISOString()}'`
    : `plays.time <'${to.toISOString()}'`
}
GROUP BY a.artistid
ORDER BY plays DESC
LIMIT ${take}
OFFSET ${skip}`);
    let songs = await spotify.tracks(data.map((p: any) => p.uri.split(":")[2]));
    return songs.map((song: any, index: number) => {
      return new GQLArtistStats(
        new GQLArtist(song.name, song.images),
        data[index].playtime,
        data[index].plays
      );
    });
  }
}
