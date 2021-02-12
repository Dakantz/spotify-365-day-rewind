<template>
  <div class="stats">

    <div class="text-h2 ma-12">Site-Wide statistics</div>
    <v-container>
      <v-row>
        <v-col>
          <total-widget class="widget" :id="`total-1`" :global="true" />
        </v-col>
        <v-col>
          <chart-widget class="widget" :id="`chart-1`" :global="true" />
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <top-widget class="widget" :id="`top-1`" :global="true" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import ChartWidget from "../components/ChartWidget.vue";
import TopWidget from "../components/TopWidget.vue";
import TotalWidget from "../components/TotalWidget.vue";
export default {
  components: {
    TotalWidget,
    ChartWidget,
    TopWidget,
  },
};
</script>

<style>
.widget {
  margin: 10px;
}
</style>
