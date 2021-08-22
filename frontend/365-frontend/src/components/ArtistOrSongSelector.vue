<template>
  <div>
    <v-select
      v-model="value"
      :hint="`Mode`"
      :items="items"
      item-text="text"
      item-value="type"
      :label="name"
      persistent-hint
      single-line
      return-object
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
      return `mode-select:${this.id}`;
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
    if (!this.value) {
      this.value = this.items.find((i) => i.type == "artists");
    }
  },
  data: () => {
    return {
      value: null,
      items: [
        {
          text: "Artists",
          type: "artists",
        },
        {
          text: "Songs",
          type: "songs",
        },
      ],
    };
  },
};
</script>

<style></style>
