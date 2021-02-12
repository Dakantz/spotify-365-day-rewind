<template>
  <v-card>
    <v-card-title>
      <v-progress-linear
        v-if="$apollo.loading"
        indeterminate
      ></v-progress-linear>
      <div v-else-if="this.statistics && this.timeframe">
        {{ selectedStat }}
      </div>
    </v-card-title>
    <v-card-text>
      Total&nbsp;
      <span class="inText" v-if="statistics">{{ statistics }}</span>
      <span class="inText" v-else>...</span> within last&nbsp;
      <span class="inText" v-if="timeframe">{{ timeframe.text }}</span>
      <span class="inText" v-else>...</span>
    </v-card-text>
    <v-card-actions>
      <statistics-selector
        v-model="statistics"
        :id="`total:${id}`"
        :name="`Type`"
      />
      <time-frame-selector
        v-model="timeframe"
        :id="`total:${id}`"
        :name="`Time`"
        :hint="`Timeframe`"
      />
    </v-card-actions>
  </v-card>
</template>

<script>
import StatisticsSelector from "./StatisticsSelector.vue";
import TimeFrameSelector from "./TimeFrameSelector.vue";
import gql from "graphql-tag";

export default {
  props: {
    id: String,
    global: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    StatisticsSelector,
    TimeFrameSelector,
  },
  computed: {
    selectedStat() {
      return this.totalStats[this.statistics];
    },
  },
  apollo: {
    totalStats: {
      query: gql`
        query totalTime($from: String, $to: String, $global:Boolean) {
          me {
            ... on User {
              name
              email
              stats(scale: HOUR, steps: 1, from: $from, to: $to, global: $global) {
                total {
                  plays
                  minutes
                  time
                }
              }
            }
          }
        }
      `,
      variables() {
        let from_maybe = this.timeframe
          ? new Date(Date.now() - this.timeframe.interval).toISOString()
          : null;
        return {
          from: from_maybe ? from_maybe : new Date().toISOString(),
          to: new Date().toISOString(),
        };
      },
      skip() {
        return !(this.statistics && this.timeframe);
      },
      update(data) {
        return data.me.stats.total;
      },
    },
  },
  data: () => {
    return {
      statistics: null,
      timeframe: null,
    };
  },
};
</script>

<style>
.inText {
}
</style>
