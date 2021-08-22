<template>
  <v-card>
    <v-card-title
      ><span v-if="global" class="mr-2">Our</span
      ><span v-else class="mr-2">Your</span> top <span v-if="mode" class="ml-2">{{ mode.type }}</span
      ><span v-else>...</span>
      <v-spacer></v-spacer>

      <artist-or-song-selector
        v-model="mode"
        :id="`top:${id}`"
        :name="`Top`"
        :hint="`Artists or Songs`"
      />
      <time-frame-selector
        v-model="timeframe"
        :id="`top:${id}`"
        :name="`Time`"
        :hint="`Timeframe`"
      />
    </v-card-title>

    <v-card-text>
      <v-progress-circular
        v-if="$apollo.queries.topStats.loading"
        indeterminate
      ></v-progress-circular>
      <v-list v-else three-line>
        <template v-for="(stat, index) in topStats">
          <v-list-item :key="stat.title">
            <v-list-item-avatar>
              <v-img :src="stat.item.cover[2].url"></v-img>
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title v-html="stat.item.name"></v-list-item-title>
              <v-list-item-subtitle
                >#{{ index + 1 }}, {{ stat.plays }} plays and
                {{ stat.minutes }} minutes</v-list-item-subtitle
              >
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list>
    </v-card-text>
    <v-card-actions>
    </v-card-actions>
  </v-card>
</template>

<script>
import ArtistOrSongSelector from "./ArtistOrSongSelector.vue";
import TimeFrameSelector from "./TimeFrameSelector.vue";
import gql from "graphql-tag";

export default {
  components: { TimeFrameSelector, ArtistOrSongSelector },
  props: {
    id: String,
    global:{
      type:Boolean,
      default:false
    }
  },
  data: () => {
    return {
      timeframe: null,
      mode: null,
    };
  },

  computed: {
    selectedStat() {
      return this.totalStats[this.statistics];
    },
  },
  apollo: {
    topStats: {
      query() {
        return gql`
        query topStats($from: String, $to: String, $take:Int, $global:Boolean) {
          me {
            ... on MeUser {
              name
              email
              ${
                this.mode.type == "songs"
                  ? `
              mostPlayedSongs(from: $from, to: $to, take:$take, global: $global){
                plays
                minutes
                song {
                  name
                  cover {
                    url
                  }
                }
              }`
                  : `
              mostPlayedArtists(from: $from, to: $to, take:$take, global: $global) {
                plays
                plays
                minutes
                artist {
                  name
                  cover {
                    url
                  }
                }
              }`
              }
            }
          }
        }
      `;
      },
      variables() {
        let from_maybe = this.timeframe
          ? new Date(Date.now() - this.timeframe.interval).toISOString()
          : null;
        return {
          from: from_maybe ? from_maybe : new Date().toISOString(),
          to: new Date().toISOString(),
          take: 10,
          global: this.global,
        };
      },
      skip() {
        return !(this.mode && this.timeframe);
      },
      update(data) {
        let mapped =
          this.mode.type == "artists"
            ? data.me.mostPlayedArtists.map((artist) => {
                artist.item = artist.artist;
                return artist;
              })
            : data.me.mostPlayedSongs.map((song) => {
                song.item = song.song;
                return song;
              });
        console.log(mapped);
        return mapped;
      },
    },
  },
};
</script>

<style></style>
