<template>
  <v-autocomplete
    v-model="select"
    :loading="$apollo.queries.artists.loading"
    :items="artists"
    :search-input.sync="search"
    cache-items
    class="mx-4"
    hide-no-data
    label="Artist"
    item-value="id"
    item-text="name"
    dense
  >
    <template v-slot:selection="data">
      <v-chip v-bind="data.attrs">
        <v-avatar left>
          <v-img :src="data.item.cover[2].url"></v-img>
        </v-avatar>
        {{ data.item.name }}
      </v-chip>
    </template>
    <template v-slot:item="data">
      <v-chip v-bind="data.attrs">
        <v-avatar left>
          <v-img :src="data.item.cover[2].url"></v-img>
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
    artist: {
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
    artists: {
      query() {
        return gql`
          query artists($query: String!, $take: Int) {
            findArtist(query: $query, take: $take) {
              ... on Artists {
                artists {
                  id
                  name
                  cover {
                    url
                    width
                  }
                }
              }
            }
          }
        `;
      },
      variables() {
        return {
          take: 15,
          query: this.search ? this.search : "",
        };
      },
      skip() {
        return !this.search || this.search.length == 0;
      },
      update(data) {
        let mapped = data.findArtist.artists;
        return mapped;
      },
    },
  },
};
</script>

<style></style>
