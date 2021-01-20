<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title class="headline text-uppercase">365 days of rewind</v-toolbar-title>

       <v-btn class="ml-2 mr-2" text to="/" >
        <span class="mr-2">Info</span>
      </v-btn>
      <v-btn v-if="loggedIn" text to="/stats" class="mr-2">
        <span class="mr-2">Stats</span>
      </v-btn>
      <v-btn v-if="loggedIn" text to="/settings" class="mr-2">
        <span class="mr-2">Settings</span>
      </v-btn>

       <v-btn text to="/about" class="mr-2">
        <span class="mr-2">About</span>
      </v-btn>
      <v-spacer></v-spacer>
      <div v-if="loggedIn">Logged in as {{ userInfo.name }}</div>
      <v-btn
        v-else
        :href="client_url"
        target="_blank"
        :loading="$apollo.queries.client_url.loading"
        >Login (via Spotify)
      </v-btn>
    </v-app-bar>
    <v-main app>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
import { mapState } from "vuex";
import gql from "graphql-tag";
import * as querystring from "querystring";
export default {
  name: "App",

  components: {},
  computed: mapState([
    // map this.count to store.state.count
    "loggedIn",
    "userInfo",
  ]),
  data: () => ({ drawer: false }),
  apollo: {
    client_url: {
      query: gql`
        query {
          clientToken
        }
      `,
      update: (data) => {
        console.log(data);
        let query = {
          client_id: data.clientToken,
          response_type: "code",
          redirect_uri:
            window.location.protocol +
            "//" +
            window.location.host +
            "/callback",
          scope: [
            "user-read-playback-state",
            "user-read-currently-playing",
            "playlist-modify-public",
            "user-read-email",
            "user-library-read",
            "user-read-recently-played",
            "user-top-read",
            "user-read-playback-position",
          ].join(" "),
          show_dialog: false,
        };
        return (
          "https://accounts.spotify.com/authorize?" +
          querystring.stringify(query)
        );
      },
    },
  },
  created: async function() {
    let token = localStorage.getItem("backend-token");
    if (token) {
      await this.$store.dispatch("logIn", token);
    }
  },
};
</script>
