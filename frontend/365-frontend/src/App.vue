<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title>365 days of rewind</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn
        :href="client_url"
        target="_blank"
        :loading="$apollo.queries.client_url.loading"
        >Login (via Spotify)
      </v-btn>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
import gql from "graphql-tag";
import * as querystring from "querystring";
export default {
  name: "App",

  components: {},

  data: () => ({}),
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
  created: function() {},
};
</script>
