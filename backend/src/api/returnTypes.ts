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
  constructor(public token: string, public user: GQLUser) {
  }
}
