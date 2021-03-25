import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Callback from '../views/Callback.vue'
import Stats from '../views/Stats.vue'
import GlobalStats from '../views/GlobalStats.vue'
import Settings from '../views/Settings.vue'
import PlaylistManager from '../views/PlaylistManager.vue'


Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/callback',
    name: 'Callback',
    component: Callback
  },
  {
    path: '/stats',
    name: 'Stats',
    component: Stats
  },
  {
    path: '/global-stats',
    name: 'GlobalStats',
    component: GlobalStats
  },
  {
    path: '/playlist-manager',
    name: 'PlaylistManager',
    component: PlaylistManager
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: function () {
      return import(/* webpackChunkName: "about" */ '../views/About.vue')
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
