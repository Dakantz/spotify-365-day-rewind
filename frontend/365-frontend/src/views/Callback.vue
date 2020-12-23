<template>
  <div class="callback">
    <h1>Welcome back!</h1>
    <h2>We are getting everything ready, hold tight!</h2>
    <div v-if="error">
      Failed to sign you up, please try again!, reason: {{ error }}
    </div>
    <v-progress-circular v-else indeterminate />
  </div>
</template>

<script>
import { mapActions } from "vuex";
import { onLogin } from "../plugins/vue-apollo";
import gql from "graphql-tag";
export default {
  name: "Callback",
  components: {},
  ...mapActions(["logIn"]),
  data: () => ({
    error: null,
  }),
  created: async function() {
    try {
      let query = this.$route.query;
      if (query.error) {
        this.errpr = query.error;
      } else {
        let userData = await this.$apollo.mutate({
          // Query
          mutation: gql`
            mutation($code: String!, $redirectUrl: String!) {
              registerOrLogin(code: $code, redirectUrl: $redirectUrl) {
                ... on AuthentificationResponse {
                  token
                  user {
                    name
                    email
                  }
                }
                ... on Error {
                  message
                }
              }
            }
          `,
          // Parameters
          variables: {
            code: query.code,
            redirectUrl:
              window.location.protocol +
              "//" +
              window.location.host +
              "/callback",
          },
          fetchPolicy: "no-cache",
        });
        console.log(userData.data);
        if (
          userData.data.registerOrLogin.__typename == "AuthentificationResponse"
        ) {
          await this.$store.dispatch("logIn", userData.data.registerOrLogin.token);
          onLogin(
            this.$apollo.provider.defaultClient,
            userData.data.registerOrLogin.token
          );
          this.$router.push("stats");
        } else {
          this.error = userData.data.registerOrLogin.message;
        }
      }
    } catch (e) {
      console.error("Failed in callback:", e);
    }
  },
};
</script>

<style>
.callback {
  align-items: center;
  justify-content: center;
  flex-direction: column;
  display: flex;
}
</style>
