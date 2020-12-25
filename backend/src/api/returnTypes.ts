import { artists, songs } from "@prisma/client";

export class GQLError {
  get __typename() {
    return "Error";
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
    public from?: String,
    public to?: String,
    public userId?: number
  ) {}
}

export class GQLStats {
  get __typename() {
    return "Stats";
  }
  constructor(
    public scale: string,
    public from: String,
    public to: String,
    public wantedSteps: number,
    public userId?: number
  ) {}
}
