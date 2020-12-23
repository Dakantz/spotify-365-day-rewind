import { PrismaClient } from "@prisma/client";
import { SpotifyClient } from "./spotify";

export class SpotifySyncHelper {
  private spotify: SpotifyClient;
  constructor(public db: PrismaClient, public token: string) {
    this.spotify = new SpotifyClient(token);
  }
  async addArtist(artistUri: string) {
    let existing = await this.db.artists.findFirst({
      where: {
        uri: artistUri,
      },
    });
    if (!existing) {
      let artist = await this.spotify.artist(artistUri.split(":")[2]);
      let existingGenres = await this.db.genres.findMany({
        where: {
          name: {
            in: artist.genres,
          },
        },
      });

      let genres = artist.genres.filter(
        (genre: string) =>
          !existingGenres.find((existing) => existing.name == genre)
      );
      let artistDb = await this.db.artists.create({
        select: {
          artistid: true,
        },
        data: {
          name: artist.name,
          uri: artist.uri,
          artistgenres: {
            connectOrCreate: {
              ...existingGenres.map((genre) => {
                return {
                  where: {
                    gid: genre.gid,
                  },
                };
              }),
              ...genres.map((genre: string) => {
                return {
                  create: {
                    name: genre,
                  },
                };
              }),
            },
          },
        },
      });
      return artistDb.artistid;
    }
    return existing?.artistid;
  }
  async addAlbum(albumUri: string, artistId: number) {
    let existingAlbum = await this.db.albums.findFirst({
      where: {
        uri: albumUri,
      },
    });
    if (!existingAlbum) {
      let album = await this.spotify.artist(albumUri.split(":")[2]);
      let albumDb = await this.db.albums.create({
        select: {
          albumid: true,
        },
        data: {
          name: album.name,
          artists: {
            connect: {
              artistid: artistId,
            },
          },
          uri: albumUri,
        },
      });
      return albumDb.albumid;
    }
    return existingAlbum?.albumid;
  }
  async addTrack(track: any) {
    let existing = await this.db.songs.findFirst({
      where: {
        uri: track.id,
      },
    });
    if (!existing) {
      let fullTrack = await this.spotify.track(track.id);
      let artistId = await this.addArtist(fullTrack.artist.uri);
      let albumId = await this.addAlbum(fullTrack.album.uri, artistId);
      let trackDb = await this.db.songs.create({
        select: {
          songid: true,
        },
        data: {
          explicit: fullTrack.explicit,
          name: fullTrack.name,
          uri: fullTrack.uri,
          albums: {
            connect: {
              albumid: albumId,
            },
          },
          artists: {
            connect: {
              artistid: artistId,
            },
          },
        },
      });
      return trackDb.songid;
    }
    return existing.songid;
  }
}
