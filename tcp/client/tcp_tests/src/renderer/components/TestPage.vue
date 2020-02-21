<template>
  <div class="tests">
    <div v-if="$store.getters.question">
      <div class="headline tests-title my-4">{{$store.getters.current.title}}</div>
      <div class="body-1 my-2 question">{{$store.getters.question.title}}</div>
      <div class="answers">
        <v-btn class="answer elevation-0 my-2" v-for="(answer) in $store.getters.question.answers" :key="answer.id" rounded large @click="sendAnswer(answer.id)">
          {{answer.title}}
        </v-btn>
      </div>
    </div>
    <div v-else-if="$store.getters.result" class="answers">
      <div class="headline tests-title my-4">Result: {{Math.round($store.getters.result.result * 100)}}%!</div>
      <v-btn class="elevation-0 mt-4" color="success" rounded large @click="close">
        Return to tests list
        <v-icon class="mdi mdi-chevron-right"></v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script>
	export default {
		name: "TestPage",
    methods: {
			close() {
				this.$store.dispatch('next');
      },
      sendAnswer(index) {
				this.$store.dispatch('sendAnswer', index)
      }
    }
	}
</script>

<style lang="scss">
  .question {
    text-align: center;
  }
  .answers {
    display: flex;
    flex-direction: column;
  }
</style>