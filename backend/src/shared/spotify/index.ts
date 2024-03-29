import axios, { Method } from "axios";
import querystring from "querystring";

export function idFromUri(uri: string) {
  return uri.split(":")[2];
}
export class SpotifyClient {
  public baseUrl: string = "https://api.spotify.com/v1";
  private headers: { [key: string]: string } = {};
  constructor(public token: string) {
    this.headers["Authorization"] = "Bearer " + token;
  }
  private async requestData(
    url: string,
    query: any = {},
    method: Method = "GET",
    data: any = null
  ) {
    while (true) {
      try {
        return await axios.request({
          url: this.baseUrl + url,
          method,
          params: query,
          data,
          headers: this.headers,
        });
      } catch (error:any) {
        if (error.response && error.response.status == 429) {
          await new Promise((resolve) =>
            setTimeout(
              () => resolve(null),
              (error.headers["Retry-After"] + 1) * 1000
            )
          );
        } else {
          console.error("Error while requesting data from spotify", error);
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
  private toCSL(ids: string[]) {
    return ids.reduce((prev, val) => prev + (prev.length ? "," : "") + val, "");
  }
  public async tracks(ids: string[]) {
    if (ids.length > 0)
      return (await this.requestData("/tracks", { ids: this.toCSL(ids) })).data
        .tracks;
    else return []
  }
  public async artists(ids: string[]) {
    if (ids.length > 0)
      return (await this.requestData("/artists", { ids: this.toCSL(ids) })).data
        .artists;
    else return []
  }
  public async features(ids: string[]) {
    if (ids.length > 0)
      return (await this.requestData("/audio-features", { ids: this.toCSL(ids) }))
        .data.audio_features;
    else return []
  }
  public async album(id: string) {
    return (await this.requestData("/albums/" + id)).data;
  }
  public async user(id: string) {
    return (await this.requestData("/users/" + id)).data;
  }

  public async playlistOfUser(id: string) {
    return (
      await this.requestData(`/users/${id}/playlists`)
    ).data;
  }
  public async myPlaylists() {
    return (
      await this.requestData(`/me/playlists`)
    ).data;
  }

  public async createPlaylist(
    userid: string,
    name: string,
    playlist_public: boolean = false,
    collaborative: boolean = false,
    description: string = ""
  ) {
    return (
      await this.requestData(`/users/${userid}/playlists`, {}, "POST", {
        name,
        collaborative,
        public: playlist_public,
        description,
      })
    ).data;
  }
  public async replacePlaylistItems(playlistid: string, uris: string[]) {
    return (
      await this.requestData(`/playlists/${playlistid}/tracks`, {}, "PUT", {
        uris,
      })
    ).data;
  }
  public async changePlaylist(
    playlistid: string,
    options: { [key: string]: string | boolean }
  ) {
    return (
      await this.requestData(`/playlists/${playlistid}`, {}, "PUT", options)
    ).data;
  }
  public async playlist(playlistid: string) {
    return (await this.requestData(`/playlists/${playlistid}/tracks`)).data;
  }
  public async recommendations(artist_ids: string[], song_ids: string[]) {
    return (
      await this.requestData("/recommendations", {
        seed_artists: this.toCSL(artist_ids),
        seed_tracks: this.toCSL(song_ids),
        seed_genres: ",",
      })
    ).data;
  }
  public async likedSongs(offset=0, limit=50) {
    return (
      await this.requestData("/me/tracks", {
        offset: offset,
        limit: limit,
      })
    ).data;
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

  constructor(public clientId: string, public clientSecret: string) { }
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
