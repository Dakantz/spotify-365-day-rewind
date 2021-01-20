<template>
  <div class="home">
    <div class="text-center">
      <div class="text-h1 ma-12">Welcome to 365 days of rewind!</div>
      <div class="text-h2 ma-12" v-if="!loggedIn">
        To get started, <v-btn :href="client_url">log in</v-btn>
      </div>
      <div class="text-h2 ma-12" v-else>
        To see your stats go to
        <v-btn to="/stats"   x-large><span class="text-h3 "> stats</span></v-btn>
      </div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src

import gql from "graphql-tag";
import * as querystring from "querystring";
import { mapState } from "vuex";
export default {
  name: "Home",
  computed: mapState([
    // map this.count to store.state.count
    "loggedIn",
    "userInfo",
  ]),
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
};
</script>
