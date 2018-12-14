<template>
  <div>
    <div v-if="questionStage">
      <Question 
                :question="questions[currentQuestion]"
                v-on:answer="handleAnswer"
                :question-number="currentQuestion+1"
      ></Question>
    </div>
    
    <div v-if="resultsStage">
      <slot name="results" :length="questions.length" :perc="perc" :correct="correct">
      You got {{correct}} right out of {{questions.length}} questions. Your percentage is {{perc}}%.
      </slot>
    </div>
  </div>
</template>

<script lang="ts">
import firebase from 'firebase';
import axios from 'axios';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { IQuestionData } from "../types";
import Question from '@/components/Question.vue'; 
import { db } from '../db';

@Component({
  components: {
    Question,
  }
})
export default class Quiz extends Vue {
  questionStage:boolean = false;
  resultsStage:boolean = false;
  title:string = '';
  questions: IQuestionData[] = [];
  perc:string = "";
  currentQuestion:number = 0;
  quizId:string = "";

  @Prop() private quiz!: any;

  created() {
    console.log(this.quiz);
    if (this.quiz) {
      this.quizId = this.quiz.id;
      this.currentQuestion = this.quiz.currentQuestion ? this.quiz.currentQuestion : 0;
      this.questions = this.quiz.data.questions;
      this.title = this.quiz.data.text;
      this.questionStage = true;
    }
  }

  handleAnswer(answer:string) {
    const user:any = firebase.auth().currentUser;
    const token = user.getIdToken();
    token.then((tk:any) => {
      axios.post(
        "https://us-central1-test-b95ec.cloudfunctions.net/answerQuiz",
       // "http://localhost:5000/test-b95ec/us-central1/answerQuiz",
        { quiz: this.quizId, question: this.currentQuestion, answer },
        {
          headers: {
            "Authorization": `Bearer ${tk}`
          }
        }
      )
      .then((response:any) => {
        const data:any = response.data;
        if (data.complete) {
          this.questionStage = false;
          this.resultsStage = true;
          this.perc = data.perc;
          this.$emit('end');
        } else {
          this.currentQuestion = data.currentQuestion;
        }
      }).catch((err) => {
        console.log(err);
      });   
    })
  }
}
</script>