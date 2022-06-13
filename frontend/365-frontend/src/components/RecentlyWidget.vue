<template>
  <v-card>
    <v-card-title
      ><span v-if="global" class="mr-2">Our</span
      ><span v-else class="mr-2">Your</span> recently played songs
      <v-spacer></v-spacer>
    </v-card-title>

    <v-card-text>
      <v-progress-circular v-if="loading" indeterminate></v-progress-circular>
      <v-list v-else two-line>
        <template v-for="(song, index) in recentlyPlayed">
          <v-list-item :key="song.name">
            <v-list-item-avatar>
              <v-img :src="song.cover[2].url"></v-img>
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title v-html="song.name"></v-list-item-title>
              <v-list-item-subtitle
                >#{{ index + 1 }}
                {{ song.artists[0].name }}</v-list-item-subtitle
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
      recentlyPlayed: [],
      skip: 0,
      take: 50,
      loading: false,
    };
  },

  created() {
    this.loadMore();
  },

  methods: {
    async loadMore() {
      try {
        let recentlyPlayed = await this.$apollo.query({
          // Query
          query: gql`
            query recentSongs($take: Int, $skip: Int) {
              me {
                ... on MeUser {
                  name
                  email
                  recentlyPlayedSongs(take: $take, skip: $skip) {
                    plays
                    minutes
                    song {
                      name
                      artists {
                        name
                      }
                      cover {
                        url
                      }
                    }
                  }
                }
              }
            }
          `,
          // Parameters
          variables: {
            skip: this.skip,
            take: this.take,
          },
          fetchPolicy: "no-cache",
        });
        let songs = recentlyPlayed.data.recentSongs.me.recentlyPlayedSongs;
        console.log("Got songs:", songs);
        this.skip += songs.length;
        this.recentlyPlayed.push(...songs);
      } catch (error) {
        console.error("Failed to fetch songs: ", error);
      }
    },
  },
};
</script>

<style></style>
