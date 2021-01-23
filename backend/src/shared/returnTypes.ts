import { artists, songs } from "@prisma/client";

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
export class GQLUser {
  get __typename() {
    return "User";
  }
  constructor(
    public name: string,
    public email: string,
    public token: string
  ) {}
}
export class GQLAuthentificationResponse {
  get __typename() {
    return "AuthentificationResponse";
  }
  constructor(public token: string, public user: GQLUser) {}
}

export type ScaleSteps = "HOUR" | "DAY" | "WEEK" | "MONTH" | "DOW";

export class GQLStatPoint {
  get __typename() {
    return "StatPoint";
  }
  constructor(
    public minutes: number,
    public plays: number,
    public time: number,
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
  constructor(public name: string, public cover: GQLImage[]) {}
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
  constructor(public name: string, public cover: GQLImage[]) {}
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
