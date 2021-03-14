import { JsonObject, PrismaClient } from "@prisma/client";
import { Job } from "bullmq";
import { queueMap } from ".";
import { GQLImage, GQLPublicUser, GQLSSong } from "./returnTypes";
import { idFromUri, SpotifyClient } from "./spotify";
import { Stats } from "./statistics";
import { PlaylistRefresh, SyncPlaysJob } from "./types";
export type RefreshIntervals = "DAILY" | "WEEKLY" | "MONTHLY" | "NEVER";
export type PlaylistSource = "GLOBAL" | "PERSONAL";
export interface CreatePlaylistParams {
  mode: "TOP" | "COLLABORATIVE" | "RECOMMENDATIONS";
  filtering: "TOP" | "TOP_UPBEAT" | "TOP_CHILL";
  refreshEvery: RefreshIntervals;
  timespan_ms: number;
  name: string;
  source: PlaylistSource;
  description: string;
}

export const PLAYLIST_ITEMS = 30;
export const SONGS_CONSIDERED = 200;

function intervalToCron(interval: RefreshIntervals) {
  switch (interval) {
    case "DAILY":
      return "0 0 * * *";
    case "WEEKLY":
      "0 0 * * 0";
    case "MONTHLY":
      return "0 0 1 * *";
  }
}

export interface TargetValues {
  [key: string]: number | undefined;
  acousticness?: number;
  danceability?: number;
  energy?: number;
  instrumentalness?: number;
}
export const TARGET_CHILL: TargetValues = {
  acousticness: 0.9,
  danceability: 0.3,
  energy: 0.2,
  instrumentalness: 0.8,
};
export const TARGET_UPBEAT: TargetValues = {
  acousticness: 0.3,
  danceability: 0.9,
  energy: 0.8,
  instrumentalness: 0.2,
};
export class GQLPlaylistCreationResponse {
  get __typename() {
    return "SimpleMessage";
  }
  constructor(
    public success: boolean,
    public message: string,
    id?: string,
    songs?: GQLSSong[]
  ) {}
}
export class PlaylistCreator {
  private stats: Stats;
  constructor(
    private spotify: SpotifyClient,
    private db: PrismaClient,
    private queues: queueMap
  ) {
    this.stats = new Stats(db);
  }
  public async filterSongsForTarget(
    songs: GQLSSong[],
    target: TargetValues,
    target_size: number = PLAYLIST_ITEMS
  ) {
    let ids = songs.map((song) => song.id);
    let audio_analysis = [];
    let BATCH_SIZE = 100;
    for (let i = 0; i <= ids.length / BATCH_SIZE; i++) {
      let batch_ids = ids.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      audio_analysis.push(...(await this.spotify.features(batch_ids)));
    }
    let scores = audio_analysis
      .filter((features) => !!features)
      .map((features, idx) => {
        let sq_error = 0;
        for (const key in target) {
          if (
            Object.prototype.hasOwnProperty.call(target, key) &&
            Object.prototype.hasOwnProperty.call(features, key)
          ) {
            let target_val = target[key] as number;
            let feature_val = features[key] as number;
            let err = target_val - feature_val;
            sq_error += err * err;
          }
        }
        let err = Math.sqrt(sq_error);
        return { err, idx };
      })
      .sort((a, b) => a.err - b.err)
      .slice(0, target_size)
      .sort((a, b) => a.idx - b.idx);
    return scores.map((score) => songs[score.idx]);
  }
  public async songsForPlaylist(
    params: CreatePlaylistParams,
    userId: number
  ): Promise<GQLSSong[]> {
    let to = new Date();
    let from = new Date(to.getTime() - params.timespan_ms);

    switch (params.mode) {
      case "TOP":
        let songs: GQLSSong[] = [];
        let next_songs;
        let offset = 0;

        while (
          (next_songs = await this.stats.mostPlayedSongs(
            this.spotify,
            to,
            50,
            offset,
            from,
            params.source == "PERSONAL" ? userId : undefined
          )).length != 0 &&
          songs.length < SONGS_CONSIDERED
        ) {
          offset += next_songs.length;
          songs.push(...next_songs.map((songstats) => songstats.song));
        }
        switch (params.filtering) {
          case "TOP_CHILL":
            return await this.filterSongsForTarget(songs, TARGET_CHILL);
          case "TOP_UPBEAT":
            return await this.filterSongsForTarget(songs, TARGET_UPBEAT);
          case "TOP":
          default:
            return songs.slice(0, PLAYLIST_ITEMS);
        }
        break;
      case "RECOMMENDATIONS":
        let seed_song_ids = (
          await this.stats.mostPlayedSongs(
            this.spotify,
            to,
            2,
            0,
            from,
            params.source == "PERSONAL" ? userId : undefined
          )
        ).map((stat) => stat.song.id);

        let seed_artist_ids = (
          await this.stats.mostPlayedArtists(
            this.spotify,
            to,
            3,
            0,
            from,
            params.source == "PERSONAL" ? userId : undefined
          )
        ).map((stat) => stat.artist.id);
        if (seed_artist_ids.length + seed_song_ids.length == 0) {
          return [];
        }
        let recommendations = await this.spotify.recommendations(
          seed_artist_ids,
          seed_song_ids
        );
        return recommendations.tracks.map(
          (track: any) =>
            new GQLSSong(track.id, track.name, track.album.images, track.uri)
        );
    }
    return [];
  }
  public async updatePlaylist(
    playlistId: number,
    userId: number,
    songs: GQLSSong[]
  ): Promise<boolean> {
    let playlist = await this.db.playlists.findFirst({
      where: {
        playlistid: playlistId,
      },
    });
    if (playlist) {
      await this.spotify.replacePlaylistItems(
        idFromUri(playlist.uri),
        songs.map((song) => song.uri)
      );
      await this.db.playlists.update({
        data: {
          last_update: new Date(),
        },
        where: {
          playlistid: playlistId,
        },
      });
      return true;
    } else {
      return false;
    }
  }
  public async createPlaylist(
    params: CreatePlaylistParams,
    userId: number
  ): Promise<GQLPlaylistCreationResponse> {
    try {
      /**
       * 1. Fetch songs
       * 2. Create job (if repeated)
       * 3. Start job once
       */
      let songs = await this.songsForPlaylist(params, userId);
      let user = await this.db.users.findFirst({
        where: {
          userid: userId,
        },
      });
      if (user) {
        let playlist = await this.spotify.createPlaylist(
          idFromUri(user?.uri),
          params.name,
          false,
          false
        );
        let playlist_db = await this.db.playlists.create({
          data: {
            parameters: (params as unknown) as JsonObject,
            uri: playlist.uri,
            userid: userId,
            active: true,
          },
        });
        this.updatePlaylist(playlist_db.playlistid, userId, songs);
        if (params.refreshEvery != "NEVER") {
          this.queues[PlaylistRefresh.jobName].add(
            `refresh-playlist:${playlist_db.playlistid}`,
            new PlaylistRefresh(userId, playlist_db.playlistid),
            {
              repeat: { cron: intervalToCron(params.refreshEvery) },
            }
          );
        } else {
          // do nothing
        }
        return new GQLPlaylistCreationResponse(
          true,
          "Successfully created playlist and queued job!"
        );
      } else {
        throw new Error("User not found!");
      }
    } catch (error) {
      console.error("Failed to create playlist, reason:", error);
      return new GQLPlaylistCreationResponse(
        false,
        "Error creating playlist:" + error.message
      );
    }
  }
  public async refreshPlaylist(job: Job<PlaylistRefresh>) {
    let playlist_db = await this.db.playlists.findFirst({
      where: {
        playlistid: job.data.playlistId,
      },
    });
    if (playlist_db && playlist_db.active) {
      console.log("Updating playlist for user ", job.data.userId);
      let songs = await this.songsForPlaylist(
        (playlist_db.parameters as unknown) as CreatePlaylistParams,
        job.data.userId
      );
      await this.updatePlaylist(playlist_db.playlistid, job.data.userId, songs);
      console.log("done!");
    } else {
      console.warn(
        "Playlist not found or not active! id:",
        job.data.playlistId
      );
    }
  }
}
