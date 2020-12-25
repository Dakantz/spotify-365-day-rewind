<template>
  <v-card >
    <v-card-title> </v-card-title>
    <v-card-text>
      <bar-chart :options="chartOptions" :chartData="chartData" :height="250"> </bar-chart>
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
import BarChart from "./BarChart.vue";
import StatisticsSelector from "./StatisticsSelector.vue";
import TimeFrameSelector from "./TimeFrameSelector.vue";

import gql from "graphql-tag";
export default {
  components: { BarChart, StatisticsSelector, TimeFrameSelector },
  props: {
    id: String,
  },

  apollo: {
    steps: {
      query: gql`
        query steps($from: String, $to: String, $scale: Scale!, $steps: Int!) {
          me {
            ... on User {
              name
              email
              stats(scale: $scale, steps: $steps, from: $from, to: $to) {
                steps {
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
          steps: -1,
          scale: this.timeframe.subScale,
        };
      },
      skip() {
        return !(this.statistics && this.timeframe);
      },
      update(data) {
        return data.me.stats.steps;
      },
    },
  },
  computed: {
    chartData() {
      let data = this.steps
        ? this.steps.map((step) => step[this.statistics])
        : [];
      console.log(data);
      return {
        labels: this.steps ? this.steps.map((step) => step.time) : [],
        datasets: [
          {
            backgroundColor: "green",
            borderColor: "darkgreen",
            label: this.statistics,
            data,
          },
        ],
      };
    },
  },
  data: () => {
    return {
      timeframe: null,
      statistics: null,
      chartOptions: {
        responsive: true,
        canvas: {
        },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
        canvas: {
          aspectRatio: 2,
        },
      },
    };
  },
};
</script>

<style></style>
