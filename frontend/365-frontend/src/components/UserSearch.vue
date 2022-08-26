<template>
  <v-autocomplete
    v-model="select"
    :loading="$apollo.queries.users.loading"
    :items="users"
    :search-input.sync="search"
    cache-items
    class="mx-4"
    hide-no-data
    label="User"
    item-value="id"
    item-text="name"
    dense
    :multiple="true"
  >
    <template v-slot:selection="data">
      <v-chip v-bind="data.attrs">
        <v-avatar left>
          <v-img :src="data.item.image_url"></v-img>
        </v-avatar>
        {{ data.item.name }}
      </v-chip>
    </template>
    <template v-slot:item="data">
      <v-chip v-bind="data.attrs">
        <v-avatar left>
          <v-img :src="data.item.image_url"></v-img>
        </v-avatar>
        {{ data.item.name }}
      </v-chip>
    </template>
  </v-autocomplete>
</template>

<script>
import gql from "graphql-tag";

export default {
  props: {
    id: String,
    user: {
      type: Object,
      default: null,
    },
  },
  data: () => {
    return {
      select: null,
      search: null,
    };
  },
  watch: {
    select() {
      console.log("emitting", this.select);
      this.$emit("input", this.select);
    },
  },
  apollo: {
    users: {
      query() {
        return gql`
          query users($query: String!) {
            findUser(query: $query) {
              ... on PublicUserList {
                users {
                  id
                  name
                  image_url
                }
              }
            }
          }
        `;
      },
      variables() {
        return {
          query: this.search ? this.search : "",
        };
      },
      skip() {
        return !this.search || this.search.length == 0;
      },
      update(data) {
        let mapped = data.findUser.users;
        return mapped;
      },
    },
  },
};
</script>

<style></style>
