<template>
  <div class="stats">
    <div class="text-h3 ma-12">Statistics for {{ me.name }}</div>
    <v-container>
      <v-row>
        <v-col>
          <total-widget class="widget" :id="`total-1`" />
        </v-col>
        <v-col>
          <chart-widget class="widget" :id="`chart-1`" />
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <top-widget class="widget" :id="`top-1`" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import ChartWidget from "../components/ChartWidget.vue";
import TopWidget from "../components/TopWidget.vue";
import TotalWidget from "../components/TotalWidget.vue";
import gql from "graphql-tag";
export default {
  components: {
    TotalWidget,
    ChartWidget,
    TopWidget,
  },
  apollo: {
    me: {
      query: gql`
        query me {
          me {
            ... on MeUser {
              name
              email
              reportIntervals
            }
          }
        }
      `,
      update(data) {
        return data.me;
      },
    },
  },
};
</script>

<style>
.widget {
  margin: 5px;
}
</style>
