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
            v-if="$apollo.queries.preview.loading"
            indeterminate
          ></v-progress-linear>
          <v-list v-else three-line>
            <template v-for="song in preview">
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
          <v-btn text v-on:click="createPlaylist">Create!</v-btn></v-card-actions
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
  methods: {
    async createPlaylist() {
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
        this.$emit("created")
      } else {
        console.error(
          "Failed to create playlist, reason:",
          creationResult.data.me.createPlaylist.message
        );
      }
    },
  },

  apollo: {
    preview: {
      skip() {
        return !this.active;
      },
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
      active: false,
    };
  },
};
</script>

<style></style>