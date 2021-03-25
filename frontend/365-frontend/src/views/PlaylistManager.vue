<template>
  <div>
    <div class="text-h3 ma-12">Playlistmanager</div>

    <div class="text-h4 ml-12">Playlist Creator</div>
    <v-card>
      <v-card-title> </v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col > 
<v-select>
</v-select>

            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions> </v-card-actions>
    </v-card>

    <div class="text-h4 ml-12">Existing Playlists</div>
    <v-expansion-panels :max="1" class="pa-14">
      <v-expansion-panel v-for="playlist of playlists" :key="playlist.id">
        <v-expansion-panel-header>
          {{ playlist.name }}
        </v-expansion-panel-header>
        <v-expansion-panel-content> </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
import gql from "graphql-tag";
import { mapActions } from "vuex";
import { onLogout } from "../plugins/vue-apollo";
export default {
  data:()=>{
    return{

    }
  },
  apollo: {
    playlists: {
      query: gql`
        query Playlists {
          me {
            ... on MeUser {
              playlists {
                name
                mode
                filtering
                refreshEvery
                timespan_ms
                source
                songs {
                  id
                  name
                }
              }
            }
          }
        }
      `,
      update: (data) => {
        return data.me.playlists;
      },
    },
  },
};
</script>

<style>
</style>