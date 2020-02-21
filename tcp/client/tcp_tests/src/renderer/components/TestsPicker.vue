<template>
  <div class="tests">
    <div class="headline my-4 tests-title">Tests</div>
    <div class="body-1 grey--text my-4" v-if="$store.getters.last">
      Last time you completed "{{$store.getters.last.title}}" with {{Math.round($store.getters.last.result * 100)}}% correct answers
    </div>
    <div v-for="test in $store.getters.tests" :key="test.id" class="test my-4">
      <div>
        <div>{{test.title}}</div>
        <div class="overline">{{test.id}}</div>
      </div>
      <v-spacer></v-spacer>
      <v-btn small class="elevation-0" @click="startTest(test.id)">start</v-btn>
    </div>
  </div>
</template>

<script>
	export default {
		name: "TestsPicker",
    methods: {
			startTest(id) {
        this.$store.dispatch('test', id)
      }
    }
	}
</script>

<style lang="scss">
  .test {
    display: flex;
    flex-direction: row;
  }
  .tests {
    width: 420px;
    margin: 0 auto;
  }
  .tests-title {
    text-align: center;
  }
</style>