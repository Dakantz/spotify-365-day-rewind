<template>
  <v-card>
    <v-card-title
      >Users
      <span v-if="artistleaderBoard" class="ml-2"
        >for artist {{ artist ? artist.name : "..." }}</span
      >
      <v-spacer></v-spacer>

      <artist-selector
        v-if="artistleaderBoard"
        v-model="artist"
        :id="'leaderboard-artist'"
      />
      <time-frame-selector
        v-model="timeframe"
        :id="`leaderboard:${id}`"
        :name="`Time`"
        :hint="`Timeframe`"
      />
    </v-card-title>

    <v-card-text>
      <v-progress-circular
        v-if="$apollo.queries.leaderboard.loading"
        indeterminate
      ></v-progress-circular>
      <v-list v-else three-line>
        <template v-for="(entry, index) in leaderboard">
          <v-list-item :key="entry.user.id">
            <v-list-item-avatar>
              <v-img :src="entry.user.image_url"></v-img>
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title v-html="entry.user.name"></v-list-item-title>
              <v-list-item-subtitle
                >#{{ index + 1 }}, {{ entry.plays }} plays and
                {{ entry.minutes }} minutes</v-list-item-subtitle
              >
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list>
    </v-card-text>
    <v-card-actions> </v-card-actions>
  </v-card>
</template>

<script>
import TimeFrameSelector from "./TimeFrameSelector.vue";
import gql from "graphql-tag";
import ArtistSelector from "./ArtistSelector.vue";

export default {
  components: { TimeFrameSelector, ArtistSelector },
  props: {
    id: String,
    artistleaderBoard: {
      type: Boolean,
      default: false,
    },
  },
  data: () => {
    return {
      timeframe: null,
      artist: null,
    };
  },

  apollo: {
    leaderboard: {
      query() {
        return gql`
          query leaderBoard(
            $from: String!
            $to: String
            $take: Int
            $artistId: String
          ) {
            leaderboard(
              from: $from
              to: $to
              take: $take
              artistId: $artistId
            ) {
              ... on LeaderboardEntries {
                entries {
                  user {
                    name
                    id
                    image_url
                  }
                  minutes
                  plays
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
          take: 15,
          artistId: this.artist ? this.artist : null,
        };
      },
      skip() {
        console.log(this.artist, !(!this.artistleaderBoard && !!this.artist));
        return !this.timeframe || (this.artistleaderBoard && !this.artist);
      },
      update(data) {
        console.log(data);
        let mapped = data.leaderboard.entries;
        return mapped;
      },
    },
  },
};
</script>

<style></style>
