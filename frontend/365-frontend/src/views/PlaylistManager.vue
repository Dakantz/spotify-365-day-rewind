<template>
  <div>
    <div class="text-h3 ma-12">Playlistmanager</div>

    <div class="text-h4 ml-12">Playlist Creator</div>
    <div class="ma-12">
      <v-card>
        <v-card-title> Options</v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col>
                <v-text-field v-model="name" label="Playlist Name">
                </v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-select
                  v-model="filter"
                  :items="filterings"
                  item-text="name"
                  item-value="type"
                  label="Filter Mode"
                  hint="Whether the songs should be filtered"
                  persistent-hint
                >
                </v-select>
              </v-col>

              <v-col>
                <v-select
                  v-model="mode"
                  :items="modes"
                  item-text="name"
                  item-value="type"
                  label="Creation Mode"
                  hint="How the playlist should be created"
                  persistent-hint
                >
                </v-select>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-select
                  v-model="source"
                  :items="sources"
                  item-text="name"
                  item-value="type"
                  label="Creation Source"
                  hint="Where the songs should come from"
                  persistent-hint
                >
                </v-select>
              </v-col>
              <v-col>
                <time-select
                  v-model="timeframeSelection"
                  hint="Which timeframe should be considered"
                ></time-select>
              </v-col>
              <v-col>
                <refresh-selector
                  v-model="refreshInterval"
                  hint="How often the playlist should be refreshed"
                ></refresh-selector>
              </v-col>
            </v-row>
            <v-row v-if="mode=='COLLABORATIVE'">
              <v-col>
                <user-search
                  v-model="other_users"
                  :id="'user-search-playlist'"
                ></user-search>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <playlist-preview
            :options="playlistOptions"
            @created="refreshPlaylists"
          ></playlist-preview
        ></v-card-actions>
      </v-card>
    </div>
    <div class="text-h4 ml-12">Existing Playlists</div>
    <div class="ma-12">
      <v-progress-linear
        v-if="$apollo.queries.playlists.loading"
        indeterminate
      ></v-progress-linear>
      <v-expansion-panels :max="1">
        <v-expansion-panel v-for="playlist of playlists" :key="playlist.id">
          <v-expansion-panel-header>
            {{ playlist.name }}
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-container>
              <v-row>
                <v-col>
                  Filter Mode:
                  {{ nameFromType("filterings", playlist.filtering) }}
                </v-col>
                <v-col>
                  Creation Mode: {{ nameFromType("modes", playlist.mode) }}
                </v-col>
                <v-col>
                  Source: {{ nameFromType("sources", playlist.source) }}
                </v-col>
              </v-row>
            </v-container>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
      <div class="font-weight-thin mt-12">
        Note: when deleting a playlist on Spotify, it's automatically deleted
        here!
      </div>
    </div>
  </div>
</template>

<script>
import gql from "graphql-tag";
import { mapActions } from "vuex";
import { onLogout } from "../plugins/vue-apollo";
import RefreshSelector from "../components/RefreshSelector";
import TimeSelect from "../components/TimeFrameSelector";
import PlaylistPreview from "../components/PlaylistPreview.vue";
import UserSearch from "../components/UserSearch.vue";
export default {
  components: {
    TimeSelect,
    RefreshSelector,
    PlaylistPreview,
    UserSearch,
  },
  methods: {
    refreshPlaylists() {
      this.$apollo.queries.playlists.refetch();
    },
    nameFromType(property, type) {
      if (property in this) {
        let prop = this[property];
        let selection = prop.find((sel) => sel.type == type);
        if (selection) {
          return selection.name;
        }
        return null;
      }
    },
  },

  computed: {
    playlistOptions() {
      return {
        mode: this.mode,
        filtering: this.filtering,
        refreshEvery: this.refreshInterval,
        timespan_ms: this.timeframeSelection
          ? this.timeframeSelection.interval
          : 1000 * 60 * 60 * 24 * 7, //def: 1 week
        name: this.name,
        source: this.source,
        with_user: this.other_users,
        skip: this.skip,
      };
    },
  },
  data: () => {
    return {
      filter: "TOP",
      filterings: [
        {
          name: "None",
          type: "TOP",
        },

        {
          name: "Upbeat",
          type: "TOP_UPBEAT",
        },

        {
          name: "Chill",
          type: "TOP_CHILL",
        },
      ],
      mode: "TOP",
      modes: [
        {
          name: "Top",
          type: "TOP",
        },
        {
          name: "Recommendations",
          type: "RECOMMENDATIONS",
        },
        {
          name: "Collaborative",
          type: "COLLABORATIVE",
        },
      ],
      source: "PERSONAL",
      sources: [
        {
          name: "Personal",
          type: "PERSONAL",
        },

        {
          name: "Site-Wide",
          type: "GLOBAL",
        },
      ],
      refreshInterval: null,
      timeframeSelection: null,
      name: "365-rewind Playlist",
      other_users: [],
    };
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

<style></style>
