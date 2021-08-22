<template>
  <div class="leaderboards">
    <div class="text-h3 ma-12">Leaderboards</div>
    <v-container>
      <v-row>
        <v-col>
          <div class="text-h4 ma-4">Global Leaderboards</div>

          <leaderboard class="widget" :id="`leaderboard-all`" />
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <div class="text-h4 ma-4">Artist Leaderboards</div>
          <leaderboard class="widget" :id="`leaderboard-artists`" :artistleaderBoard="true"/>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import Leaderboard from "../components/LeaderBoard";
import ArtistSelector from "../components/ArtistSelector";
export default {
  components: {
    Leaderboard,
    ArtistSelector,
  },
  data: () => {
    return {
      artist: null,
    };
  },
};
</script>


    <style>
</style>