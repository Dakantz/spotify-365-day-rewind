import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify';
import { createProvider } from './plugins/vue-apollo'
import '@babel/polyfill'
Vue.config.productionTip = false

new Vue({
  router,
  store,
  vuetify,
  apolloProvider: createProvider(),
  render: function (h) { return h(App) }
}).$mount('#app')
