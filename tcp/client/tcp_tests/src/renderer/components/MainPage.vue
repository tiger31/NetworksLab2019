<template>
    <div id="form">
      <v-text-field class="my-0" placeholder="127.0.0.1:3000" rounded single-line filled clearable v-model="address"></v-text-field>
      <v-text-field class="my-0" placeholder="Login" rounded single-line filled clearable v-model="username"></v-text-field>
      <v-btn class="elevation-0" color="success" rounded large @click="login" v-if="!$store.getters.username">Log in</v-btn>
      <v-btn class="elevation-0" color="success" rounded large @click="$router.push('/tests')" v-else>
        Continue as {{$store.getters.username}}
        <v-icon class="mdi mdi-chevron-right"></v-icon>
      </v-btn>
      <v-btn class="elevation-0 mt-4" color="default" rounded large @click="close" v-show="$store.getters.username">
        Log out
      </v-btn>
      <div class="ex-error my-2" v-show="$store.getters.error">{{$store.getters.error}}</div>
    </div>
</template>

<script>

  export default {
    name: 'landing-page',
    data() {
    	return {
    		address: '10.215.5.41:3000',
        username: 'cat'
      }
    },
    methods: {
    	login() {
    		this.$store.dispatch('connect', {address: this.address, username: this.username});
      },
      close() {
    		this.$store.dispatch('close');
      }
    }
	}
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body { font-family: 'Source Sans Pro', sans-serif; }

  #wrapper {
    background:
      radial-gradient(
        ellipse at top left,
        rgba(255, 255, 255, 1) 40%,
        rgba(229, 229, 229, .9) 100%
      );
    height: 100vh;
    padding: 60px 80px;
    width: 100vw;
  }

  #form {
    display: flex;
    flex-direction: column;
    margin: 40px auto;
    width: 420px;
  }

  #logo {
    height: auto;
    margin: 0 auto;
    width: 420px;
    display: block;
  }

  .ex-error {
    color: red;
    text-align: center;
  }
</style>
