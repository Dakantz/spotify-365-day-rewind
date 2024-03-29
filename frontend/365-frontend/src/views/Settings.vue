<template>
  <div>
    <div v-if="$apollo.loading">
      <v-progress-linear indeterminate />
    </div>
    <div class="settings_root" v-else>
      <div class="text-h2 ma-12">User Settings for {{ me.name }}</div>

      <v-card class="ma-12">
        <v-card-title> Site Settings</v-card-title>
        <v-card-text>
          <v-checkbox
            class="ma-4"
            label="Allow my profile to be public"
            :input-value="me.publicDisplay"
            @change="
              function a(val) {
                setPublicDisplay(!!val);
              }
            "
          >
          </v-checkbox>
          <span color="lightgrey">
            If enabled, your user profile will be shown in the leaderboard and
            your statistics are publicly available</span
          >
        </v-card-text>
      </v-card>
      <v-card class="ma-12">
        <v-card-title> Email Settings </v-card-title>
        <v-card-text>
          <v-checkbox
            v-for="scale in reportScales"
            :key="scale"
            class="ma-4"
            :label="'Update me every ' + scale.toLowerCase()"
            :input-value="isActive(scale)"
            @change="
              function a(val) {
                updateReportInterval(scale, !!val);
              }
            "
          >
          </v-checkbox>
          Your emails will be delivered to
          <span color="lightgrey"> {{ me.email }}</span>
        </v-card-text>
      </v-card>
      <v-card class="ma-12">
        <v-card-title>GDPR Stuff</v-card-title>
        <v-card-text>
          <v-btn class="ma-4" @click="exportMe()">Export my data</v-btn>
          <v-dialog v-model="exportDialog" width="600px">
            <v-card>
              <v-card-title class="headline">
                Your Export is in progress
              </v-card-title>
              <v-card-text>
                <div v-if="exportLoading">
                  <v-progress-linear indeterminate />
                </div>
                <div v-else>
                  {{ exportState }}
                </div>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  color="green darken-1"
                  text
                  v-if="!exportLoading"
                  @click="exportDialog = false"
                >
                  Close
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-dialog v-model="deleteDialog" width="600px">
            <template v-slot:activator="{ on, attrs }">
              <v-btn class="ma-4" color="red" v-bind="attrs" v-on="on"
                >Delete my account</v-btn
              >
            </template>
            <v-card>
              <v-card-title class="headline">
                Do you really want to delete your account?
              </v-card-title>

              <v-card-text>
                <v-btn class="ma-4" color="red" @click="deleteMe()"
                  >Yes, I want to!</v-btn
                >
                <div v-if="deleteLoading">
                  <v-progress-linear indeterminate />
                </div>
                <div v-else-if="deleteState">
                  {{ deleteState }}
                </div>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  color="green darken-1"
                  text
                  v-if="!deleteLoading"
                  @click="deleteDialog = false"
                >
                  Close
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
import gql from "graphql-tag";
import { mapActions } from "vuex";
import { onLogout } from "../plugins/vue-apollo";
export default {
  data: () => {
    return {
      exportDialog: false,
      exportLoading: false,
      exportState: false,
      deleteDialog: false,
      deleteLoading: false,
      deleteState: false,
      error: null,
      reportScales: ["WEEK", "MONTH"],
    };
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
              publicDisplay
            }
          }
        }
      `,
      update(data) {
        return data.me;
      },
    },
  },
  methods: {
    ...mapActions(["logOut"]),
    isActive(scale) {
      console.log(this.me.reportIntervals, scale);
      let val =
        this.me.reportIntervals.findIndex((s) => s.includes(scale)) != -1;
      console.log(val);
      return val;
    },
    async setPublicDisplay(val) {
      console.log("Clicked setPublicDisplay", val);
      let userData = await this.$apollo.mutate({
        // Query
        mutation: gql`
          mutation setPublicDisplay($display: Boolean!) {
            me {
              setPublicDisplay(publicDisplay: $display) {
                ... on SimpleMessage {
                  message
                }
                ... on Error {
                  message
                }
              }
            }
          }
        `,
        variables: {
          display: val,
        },
        fetchPolicy: "no-cache",
      });

      this.$apollo.queries.me.refetch();
      console.log(userData.data);
    },
    async updateReportInterval(scale, val) {
      console.log("Clicked", scale, val);
      let userData = await this.$apollo.mutate({
        // Query
        mutation: gql`
          mutation interval($scale: Scale!, $val: Boolean!) {
            me {
              setReportInterval(scale: $scale, val: $val) {
                ... on SimpleMessage {
                  message
                }
                ... on Error {
                  message
                }
              }
            }
          }
        `,
        variables: {
          scale,
          val,
        },
        fetchPolicy: "no-cache",
      });
      console.log(userData.data);
    },
    async exportMe() {
      try {
        this.exportDialog = true;
        this.exportLoading = true;
        let userData = await this.$apollo.mutate({
          // Query
          mutation: gql`
            mutation {
              me {
                triggerExport {
                  ... on SimpleMessage {
                    message
                  }
                  ... on Error {
                    message
                  }
                }
              }
            }
          `,
          fetchPolicy: "no-cache",
        });
        console.log(userData.data);
        let data = userData.data.me.triggerExport;
        this.exportLoading = false;
        if (data.__typename == "SimpleMessage") {
          this.exportState = data.message;
        } else {
          this.exportState = data.message;
          this.error = data.message;
        }
      } catch (e) {
        this.exportState = e.message;
        this.error = e.message;
        this.exportLoading = false;
      }
    },
    async deleteMe() {
      try {
        this.deleteDialog = true;
        this.deleteLoading = true;
        let userData = await this.$apollo.mutate({
          // Query
          mutation: gql`
            mutation {
              me {
                delete {
                  ... on SimpleMessage {
                    message
                  }
                  ... on Error {
                    message
                  }
                }
              }
            }
          `,
          fetchPolicy: "no-cache",
        });
        console.log(userData.data);
        let data = userData.data.me.delete;
        if (data.__typename == "SimpleMessage") {
          this.deleteState = data.message;
          await this.logOut();
          onLogout(this.$apollo.provider.defaultClient);
          this.$router.push("/");
        } else {
          this.deleteState = data.message;
          this.error = data.message;
        }
      } catch (e) {
        this.deleteState = e.message;
        this.error = e.message;
        console.error(e);
      }
      this.deleteLoading = false;
    },
  },
};
</script>

<style>
.settings_root {
  padding: 20px;
}
</style>