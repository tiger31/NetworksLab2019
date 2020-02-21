<template>
  <v-app id="wrapper">
    <v-container>
      <router-link to="/">
        <img id="logo" src="~@/assets/logo.png" alt="electron-vue">
      </router-link>
      <router-view></router-view>
    </v-container>
  </v-app>
</template>

<script>
  export default {
    name: 'tcp_tests',
    mounted() {
    	this.$store.dispatch('router', this.$router);
    	if (!this.$store.getters.socket)
    		this.$store.dispatch('close');
		},
    beforeDestroy() {
    	this.$store.commit('close')
		}
	}
</script>

<style>
  /* CSS */
</style>
