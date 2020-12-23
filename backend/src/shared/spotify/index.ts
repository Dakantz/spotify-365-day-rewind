import axios from "axios";
import querystring from "querystring";
export class SpotifyClient {
  public baseUrl: string = "https://api.spotify.com/v1";
  private headers: { [key: string]: string } = {};
  constructor(public token: string) {
    this.headers["Authorization"] = "Bearer " + token;
  }
  private async requestData(url: string, query: any = {}) {
    let fullUrl = url + querystring.stringify(query);
    while (true) {
      try {
        return await axios.get(this.baseUrl + fullUrl, {
          headers: this.headers,
        });
      } catch (error) {
        if (error.status == 429) {
          await new Promise((resolve) =>
            setTimeout(() => resolve(null), error.headers["Retry-After"] * 1000)
          );
        } else {
          throw error;
        }
      }
    }
  }
  public async me() {
    return (await this.requestData("/me")).data;
  }

  public async track(id: string) {
    return (await this.requestData("/tracks/" + id)).data;
  }
  public async artist(id: string) {
    return (await this.requestData("/artists/" + id)).data;
  }
  public async album(id: string) {
    return (await this.requestData("/albums/" + id)).data;
  }
  public async recentListened(query?: any) {
    return (
      await this.requestData("/me/player/recently-played", {
        limit: 50,
        ...query,
      })
    ).data;
  }
}
export class SpotifyTokenClient {
  public baseUrl: string = "https://accounts.spotify.com/api/token";

  constructor(public clientId: string, public clientSecret: string) {}
  public async exchangeToken(code: string, redirect_uri: string) {
    let response = await axios.post(
      this.baseUrl,
      querystring.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri,
      }),
      { headers: this.buildHeaders() }
    );
    return response.data;
  }
  public async refreshToken(refresh_token: string) {
    let response = await axios.post(
      this.baseUrl,
      querystring.stringify({
        grant_type: "refresh_token",
        refresh_token,
      }),
      { headers: this.buildHeaders() }
    );
    return response.data;
  }
  private buildHeaders() {
    return {
      Authorization:
        "Basic " +
        Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64"),
    };
  }
}
