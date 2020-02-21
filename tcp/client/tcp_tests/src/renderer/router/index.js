import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: require('@/components/MainPage').default
    },
    {
      path: '/tests',
      name: 'tests-pick-page',
      component: require('@/components/TestsPicker').default
    },
    {
      path: '/test',
      name: 'tests-page',
      component: require('@/components/TestPage').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
