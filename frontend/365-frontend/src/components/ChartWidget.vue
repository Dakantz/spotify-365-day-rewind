<template>
  <v-card>
    <v-card-title> </v-card-title>
    <v-card-text>
      <line-chart :options="chartOptions" :chartData="chartData" :height="250">
      </line-chart>
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
import LineChart from "./LineChart.vue";
import StatisticsSelector from "./StatisticsSelector.vue";
import TimeFrameSelector from "./TimeFrameSelector.vue";

import gql from "graphql-tag";
export default {
  components: { LineChart, StatisticsSelector, TimeFrameSelector },
  props: {
    id: String,
    global:{
      type:Boolean,
      default:false
    }
  },

  apollo: {
    steps: {
      query: gql`
        query steps($from: String, $to: String, $scale: Scale!, $steps: Int!, $global:Boolean) {
          me {
            ... on User {
              name
              email
              stats(scale: $scale, steps: $steps, from: $from, to: $to, global: $global) {
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
        labels: this.steps ? this.steps.map((step) => new Date(step.time)) : [],
        datasets: [
          {
            borderColor: "darkgreen",
            label: this.statistics,
            data,
          },
        ],
      };
    },
    chartOptions() {
      let unit = this.timeframe
        ? this.timeframe.subScale.toLowerCase()
        : undefined;
      console.log(unit);
      return {
        responsive: true,
        canvas: {},
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
          xAxes: [
            {
              type: "time",
              time: {
                displayFormats: {
                  millisecond: "HH:mm:ss.SSS ",
                  second: "HH:mm:ss",
                  minute: "HH:mm",
                  hour: "ddd HH:mm",
                },
                unit,
              },
              ticks: {
                source: "data",
              },
              bounds: "ticks",
            },
          ],
        },
        canvas: {
          aspectRatio: 2,
        },
      };
    },
  },
  data: () => {
    return {
      timeframe: null,
      statistics: null,
    };
  },
};
</script>

<style></style>
