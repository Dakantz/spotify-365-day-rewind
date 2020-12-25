import { PrismaClient } from "@prisma/client";
import { SpotifyClient } from "../shared";
import { GQLStatPoint, GQLStats, ScaleSteps } from "./returnTypes";

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
    let query=`
    SELECT count(*) as plays, sum(s.duration_ms) / (1000 * 60) as playtime, extract(${
          parent.scale
        } FROM plays.time) as timemeaser
    FROM plays
             LEFT JOIN songs s on s.songid = plays.songid
    WHERE ${parent.userId ? "userid = " + parent.userId + " AND" : ""}
     plays.time BETWEEN '${parent.from}' AND '${parent.to}'
    GROUP BY timemeaser 
        `
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
        point.playtime,
        point.plays,
        point.time,
        undefined,
        undefined,
        parent.userId
      );
    } else {
      return new GQLStatPoint(0, 0, -1, undefined, undefined, parent.userId);
    }
  }
}
