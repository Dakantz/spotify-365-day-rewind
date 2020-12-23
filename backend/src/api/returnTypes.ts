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
  public mostPlayedSongs: songs[] = [];
  public mostPlayedArtists: artists[] = [];
  public status = {};
  public stats = {
    from: "",
  };
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
  constructor(public token: string, public user: GQLUser) {
  }
}
