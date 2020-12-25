<template>
  <div>
    <v-select
      v-model="value"
      :hint="`Statistics`"
      :items="items"
      item-text="text"
      item-value="type"
      :label="name"
      persistent-hint
      single-line
    ></v-select>
  </div>
</template>

<script>
export default {
  props: {
    id: String,
    name: String,
  },
  computed: {
    storageId() {
      return `statistics-select:${this.id}`;
    },
  },
  watch: {
    value() {
      localStorage.setItem(this.storageId, this.value);
      this.$emit("input", this.value);
    },
  },
  created() {
    this.value = localStorage.getItem(this.storageId);
  },
  data: () => {
    return {
      value: null,
      items: [
        {
          text: "Plays",
          type: "plays",
        },
        {
          text: "Minutes",
          type: "minutes",
        },
      ],
    };
  },
};
</script>

<style></style>
