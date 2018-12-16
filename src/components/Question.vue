<template>
  <div>
    <strong>Вопрос № {{ questionNumber }}:</strong><br/>
    <strong>{{ question.text }} </strong>

    <div v-if="question.type === 'tf'">
      <input type="radio" name="currentQuestion" id="trueAnswer" v-model="answer" value="t"><label for="trueAnswer">True</label><br/>
      <input type="radio" name="currentQuestion" id="falseAnswer" v-model="answer" value="f"><label for="falseAnswer">False</label><br/>
    </div>

    <div v-if="question.type === 'mc'">
      <div v-for="(mcanswer, key, index) in question.answers" :key="key">
        <input type="radio" :id="'answer'+index" name="currentQuestion" v-model="answer" :value="mcanswer.value"><label :for="'answer'+index">{{mcanswer.value}}</label><br/>
      </div>
    </div>

    <button @click="submitAnswer" class="btn btn-primary">Ответить</button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'vue-property-decorator';
import { IQuestionData } from "../types";

@Component
export default class Question extends Vue {
  answer:string = "";

  @Prop() private question!: IQuestionData;
  @Prop() private questionNumber!: number;

  submitAnswer() {
    this.$emit('answer', this.answer);
    this.answer = "";
  }
}
</script>