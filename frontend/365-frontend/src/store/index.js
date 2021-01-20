import Vue from "vue";
import Vuex, { Store } from "vuex";
import { decode } from "jsonwebtoken";
Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    loggedIn: false,
    token: "",
    userInfo: {},
  },
  mutations: {
    logOut(state) {
      state.loggedIn = false;
      state.token = "";
      state.userInfo = {};
    },
    logIn(state, token) {
      state.token = token;
      let decoded = decode(token, {
        complete: true,
        json: true,
      });
      state.loggedIn = true;
      state.userInfo = decoded.payload;
    },
  },
  actions: {
    async logOut({ commit, state }) {
      commit("logOut");
      
    },
    async logIn({ commit }, token) {
      commit("logIn", token);
    },
  },
  modules: {},
});
