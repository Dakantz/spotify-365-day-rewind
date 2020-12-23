import { ExpressContext } from "apollo-server-express/src/ApolloServer";
import { verify, sign } from "jsonwebtoken";
export class UserTokenData {
  constructor(public uid: string, public email: string, public name: string) {}
}
export class SContext {
  constructor(
    public express: ExpressContext,
    public token: string,
    public user?: UserTokenData
  ) {}
}
export async function contextFunc(context: ExpressContext): Promise<SContext> {
  let auth_header = context.req.headers.authorization;
  let token = "";
  let user: UserTokenData | undefined = undefined;
  if (auth_header) {
    let parts = auth_header.split(" ");
    if (parts.length > 1 && parts[0] == "Bearer") {
      token = parts[1];
      let decoded = verify(token, process.env.JWT_SECRET as string, {
        complete: true,
      }) as { [key: string]: { [key2: string]: string } };
      user = (decoded.body as unknown) as UserTokenData;
    }
  }

  return new SContext(context, token, user);
}
export async function createUser(code: string, callback: string) {}
