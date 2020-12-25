<template>
  <div>
    <v-select
      v-model="value"
      :hint="hint"
      :items="items"
      item-text="text"
      item-value="scale"
      :label="name"
      persistent-hint
      return-object
      single-line
    ></v-select>
  </div>
</template>

<script>
export default {
  props: {
    id: String,
    name: String,
    hint: String,
  },
  computed: {
    storageId() {
      return `time-select:${this.id}`;
    },
  },
  watch: {
    value() {
      localStorage.setItem(this.storageId, JSON.stringify(this.value));
      this.$emit("input", this.value);
    },
  },

  created() {
    this.value = JSON.parse(localStorage.getItem(this.storageId));
  },
  data: () => {
    return {
      value: null,
      items: [
        {
          text: "Week",
          interval: 1000 * 60 * 60 * 24 * 7,
          scale: "WEEK",
          subInterval: 1000 * 60 * 60 * 24,
          subScale: "DAY",
        },
        {
          text: "Day",
          interval: 1000 * 60 * 60 * 24,
          scale: "DAY",
          subInterval: 1000 * 60 * 60,
          subScale: "HOUR",
        },
        {
          text: "Month",
          interval: 1000 * 60 * 60 * 24 * 31,
          scale: "MONTH",

          subInterval: 1000 * 60 * 60 * 24,
          subScale: "DAY",
        },
        {
          text: "Year",
          interval: 1000 * 60 * 60 * 24 * 356,
          scale: "YEAR",
          subInterval: 1000 * 60 * 60 * 24 * 31,
          subScale: "MONTH",
        },
      ],
    };
  },
};
</script>

<style></style>
