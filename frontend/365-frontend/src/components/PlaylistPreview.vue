<template>
  <div>
    <v-dialog v-model="active" scrollable max-width="600px">
      <template v-slot:activator="{ on, attrs }">
        <v-btn color="primary" dark v-bind="attrs" text v-on="on">
          Preview Playlist
        </v-btn>
      </template>
      <v-card>
        <v-card-title>Playlist Preview &amp; Create </v-card-title>
        <v-card-text>
          <v-progress-linear
            v-if="$apollo.queries.preview_playlist.loading"
            indeterminate
          ></v-progress-linear>
          <v-list v-else three-line>
            <template v-for="song in preview_playlist">
              <v-list-item :key="song.id">
                <v-list-item-avatar>
                  <v-img :src="song.cover[0].url"></v-img>
                </v-list-item-avatar>

                <v-list-item-content>
                  <v-list-item-title v-html="song.name"></v-list-item-title>
                  <v-list-item-subtitle v-if="song.artists">{{
                    song.artists[0].name
                  }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text v-on:click="createPlaylist" :loading="creating"
            >Create!</v-btn
          ></v-card-actions
        >
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import gql from "graphql-tag";
export default {
  props: {
    options: Object,
  },
  watch: {
    active(a_new) {
      console.log("Changed dialog...", a_new);
      if (a_new) this.$apollo.queries.preview_playlist.refetch();
    },
  },
  methods: {
    async createPlaylist() {
      this.creating = true;
      let creationResult = await this.$apollo.mutate({
        // Query
        mutation: gql`
          mutation($input: CreatePlaylist!) {
            me {
              createPlaylist(params: $input) {
                success
                message
                id
              }
            }
          }
        `,
        // Parameters
        variables: {
          input: this.options,
        },
        fetchPolicy: "no-cache",
      });
      console.log(creationResult.data);
      if (creationResult.data.me.createPlaylist.success) {
        this.active = false;
        this.$emit("created");
      } else {
        console.error(
          "Failed to create playlist, reason:",
          creationResult.data.me.createPlaylist.message
        );
      }
      this.creating = false;
    },
  },

  apollo: {
    preview_playlist: {
      deep: true,
      variables() {
        return {
          input: this.options,
        };
      },
      update(value) {
        return value.me.previewPlaylist;
      },
      query: gql`
        query preview($input: CreatePlaylist!) {
          me {
            ... on MeUser {
              previewPlaylist(params: $input) {
                id
                name
                cover {
                  url
                }
                artists {
                  id
                  name
                }
              }
            }
          }
        }
      `,
    },
  },
  data: () => {
    return {
      creating: false,
      active: false,
    };
  },
};
</script>

<style></style>
