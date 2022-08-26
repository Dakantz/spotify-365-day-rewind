<template>
  <v-card>
    <v-card-title
      ><span v-if="global" class="mr-2">Our</span
      ><span v-else class="mr-2">Your</span> recently played songs
      <v-spacer></v-spacer>
    </v-card-title>

    <v-card-text>
      <v-progress-linear
        v-if="loading && recentlyPlayed.length == 0"
        indeterminate
      ></v-progress-linear>
      <v-list v-else two-line>
        <template v-for="(song, index) in recentlyPlayed">
          <v-list-item :key="index">
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
        <v-list-item key="load_more">
          <v-list-item-content>
            <v-btn icon @click="loadMore()" block :loading="loading" rounded
              ><v-icon>mdi-plus</v-icon></v-btn
            >
          </v-list-item-content>
        </v-list-item>
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
      this.loading = true;
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
          `,
          // Parameters
          variables: {
            skip: this.skip,
            take: this.take,
          },
          fetchPolicy: "no-cache",
        });
        let songs = recentlyPlayed.data.me.recentlyPlayedSongs;
        console.log("Got songs:", songs);
        this.skip += songs.length;
        this.recentlyPlayed.push(...songs);
      } catch (error) {
        console.error("Failed to fetch songs: ", error);
      }
      this.loading = false;
    },
  },
};
</script>

<style></style>
