<template>
  <v-card>
    <v-card-title
      ><span v-if="global" class="mr-2">Our</span
      ><span v-else class="mr-2">Your</span> top
      <span v-if="mode" class="ml-2">{{ mode.type }}</span
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
      <v-list three-line>
        <v-list-item>
          <v-progress-linear
            v-if="$apollo.queries.topStats.loading"
            indeterminate
          ></v-progress-linear>
        </v-list-item>
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
        <v-list-item key="load_more">
          <v-list-item-content>
            <v-btn icon @click="showMore()" block :loading="loadingMore" rounded
              ><v-icon>mdi-plus</v-icon></v-btn
            >
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card-text>
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
    global: {
      type: Boolean,
      default: false,
    },
  },
  data: () => {
    return {
      timeframe: null,
      mode: null,
      skip: 0,
      pageSize: 20,
      loadingMore: false,
    };
  },
  watch: {
    timeframe() {
      this.offset = 0;
    },
    mode() {
      this.offset = 0;
    },
  },
  computed: {
    selectedStat() {
      return this.totalStats[this.statistics];
    },
    queryVariables() {
      let from_maybe = this.timeframe
        ? new Date(Date.now() - this.timeframe.interval).toISOString()
        : null;
      return {
        from: from_maybe ? from_maybe : new Date().toISOString(),
        to: new Date().toISOString(),
        take: this.pageSize,
        global: this.global,
        skip: 0,
      };
    },
  },
  apollo: {
    topStats: {
      query() {
        return gql`
        query topStats($from: String, $to: String, $take:Int, $skip:Int, $global:Boolean) {
          me {
            ... on MeUser {
              name
              email
              ${
                this.mode.type == "songs"
                  ? `
              mostPlayedSongs(from: $from, to: $to, skip:$skip, take:$take, global: $global){
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
        return this.queryVariables;
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

  methods: {
    mapData(rawData) {
      let mapped =
        this.mode.type == "artists"
          ? rawData.me.mostPlayedArtists.map((artist) => {
              artist.item = artist.artist;
              return artist;
            })
          : rawData.me.mostPlayedSongs.map((song) => {
              song.item = song.song;
              return song;
            });
      return mapped;
    },
    async showMore() {
      this.skip += this.pageSize;
      let local_vars = JSON.parse(JSON.stringify(this.queryVariables));
      local_vars.skip = this.skip;
      this.loadingMore = true;
      try {
        // Fetch more data and transform the original result
        await this.$apollo.queries.topStats.fetchMore({
          // New variables
          variables: local_vars,
          // Transform the previous result with new data
          updateQuery: (previousResult, { fetchMoreResult }) => {
            if (this.mode.type == "artists") {
              previousResult.me.mostPlayedArtists = [
                ...previousResult.me.mostPlayedArtists,
                ...fetchMoreResult.me.mostPlayedArtists,
              ];
            } else {
              previousResult.me.mostPlayedSongs = [
                ...previousResult.me.mostPlayedSongs,
                ...fetchMoreResult.me.mostPlayedSongs,
              ];
            }
            return previousResult;
          },
        });
      } catch (error) {
        console.error("Error fetching more", error);
      }
      this.loadingMore = false;
    },
  },
};
</script>

<style>
</style>
