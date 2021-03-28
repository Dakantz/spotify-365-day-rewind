<template>
  <div>
    <v-select
      v-model="value"
      :hint="hint"
      :items="items"
      item-text="name"
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
    hint: String,
    showNever: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    items() {
      if (this.showNever) {
        return this.items_all;
      } else {
        return this.items_all.filter((item) => item.type != "NEVER");
      }
    },
  },
  watch: {
    value() {
      this.$emit("input", this.value);
    },
  },

  created() {
    this.$emit("input", this.value);
  },
  data: () => {
    return {
      value: "WEEKLY",
      items_all: [
        {
          name: "Daily",
          type: "DAILY",
        },
        {
          name: "Weekly",
          type: "WEEKLY",
        },
        {
          name: "Monthly",
          type: "MONTHLY",
        },
        {
          name: "Never",
          type: "NEVER",
        },
      ],
    };
  },
};
</script>

<style></style>
