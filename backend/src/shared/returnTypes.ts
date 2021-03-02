import { artists, songs } from "@prisma/client";
import { SContext } from "../api/auth";
import { SpotifyClient } from "./spotify";
import { Stats } from "./statistics";

export class GQLError {
  get __typename() {
    return "Error";
  }
  constructor(public message: string) {}
}
export class GQLMessage {
  get __typename() {
    return "SimpleMessage";
  }
  constructor(public message: string) {}
}
export abstract class GeneralUser {
  constructor(
    public id: string,
    public name: string,
    public auth_token: string
  ) {}

  async image_url(parent: GeneralUser) {
    let spotify = new SpotifyClient(parent.auth_token);
    try {
      let me = await spotify.user(this.id);
      return me.images && me.images.length > 0 ? me.images[0].url : null;
    } catch (e) {
      return null;
    }
  }
  async mostPlayedSongs(
    parent: GeneralUser,
    args: { [key: string]: any },
    context: SContext
  ) {
    let stats = new Stats(context.db);
    return await stats.mostPlayedSongs(
      new SpotifyClient(parent.auth_token),
      args.to ? new Date(args.to) : undefined,
      args.take,
      args.skip,
      args.from ? new Date(args.from) : undefined,
      args.global ? undefined : context.user?.uid
    );
  }

  async mostPlayedArtists(
    parent: GeneralUser,
    args: { [key: string]: any },
    context: SContext
  ) {
    let stats = new Stats(context.db);
    return await stats.mostPlayedArtists(
      new SpotifyClient(parent.auth_token),
      args.to ? new Date(args.to) : undefined,
      args.take,
      args.skip,
      args.from ? new Date(args.from) : undefined,
      args.global ? undefined : context.user?.uid
    );
  }
}
export class GQLMeUser extends GeneralUser {
  get __typename() {
    return "MeUser";
  }
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public token: string
  ) {
    super(id, name, token);
  }
}
export class GQLPublicUser extends GeneralUser {
  get __typename() {
    return "PublicUser";
  }
  constructor(
    public id: string,
    public name: string,
    public auth_token: string
  ) {
    super(id, name, auth_token);
  }
}
export class GQLAuthentificationResponse {
  get __typename() {
    return "AuthentificationResponse";
  }
  constructor(public token: string, public user: GQLMeUser) {}
}

export type ScaleSteps = "HOUR" | "DAY" | "WEEK" | "MONTH" | "DOW";

export class GQLStatPoint {
  get __typename() {
    return "StatPoint";
  }
  constructor(
    public minutes: number,
    public plays: number,
    public time: string,
    public from?: string,
    public to?: string,
    public userId?: number
  ) {}
}

export class GQLStats {
  get __typename() {
    return "Stats";
  }
  constructor(
    public scale: string,
    public from: string,
    public to: string,
    public scaletype: ScaleSteps,
    public wantedSteps: number,
    public userId?: number
  ) {}
}
export class GQLImage {
  get __typename() {
    return "Image";
  }
  constructor(
    public url: string,
    public height: number,
    public width: number
  ) {}
}
export class GQLArtist {
  get __typename() {
    return "Artist";
  }
  constructor(
    public id: string,
    public name: string,
    public cover: GQLImage[]
  ) {}
}

export class GQLArtistStats {
  get __typename() {
    return "ArtistStats";
  }
  constructor(
    public artist: GQLArtist,
    public minutes: number,
    public plays: number
  ) {}
}

export class GQLSSong {
  get __typename() {
    return "Song";
  }
  constructor(
    public id: string,
    public name: string,
    public cover: GQLImage[]
  ) {}
}

export class GQLSongStats {
  get __typename() {
    return "SongStats";
  }
  constructor(
    public song: GQLSSong,
    public minutes: number,
    public plays: number
  ) {}
}

export class GQLLeaderboardEntry {
  get __typename() {
    return "LeaderboardEntry";
  }
  constructor(
    public user: GQLPublicUser,
    public minutes: number,
    public plays: number
  ) {}
}
