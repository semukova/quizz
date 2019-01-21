<template>
  <div>
    <div class="jumbotron jumbotron-fluid">
      <div v-if="questionStage" class="container">
        <Question 
                  :question="questions[currentQuestion]"
                  v-on:answer="handleAnswer"
                  :question-number="currentQuestion+1"
        ></Question>
      </div>
    </div>
    <div v-if="help" class="alert alert-info" role="alert">
      {{help}}
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
import callApi from "@/api";

@Component({
  components: {
    Question,
  }
})
export default class Quiz extends Vue {
  questionStage:boolean = false;
  title:string = '';
  questions: IQuestionData[] = [];
  currentQuestion:number = 0;
  quizId:string = "";
  help:any = null;
  helpData:string = "";

  @Prop() private quiz!: any;

  created() {
    if (this.quiz) {
      this.quizId = this.quiz.id;
      this.currentQuestion = this.quiz.currentQuestion ? this.quiz.currentQuestion : 0;
      this.questions = this.quiz.data.questions;
      this.title = this.quiz.data.text;
      this.questionStage = true;
      this.help = null;
      this.helpData = this.questions[this.currentQuestion].help;
    }
  }

  handleAnswer(answer:string) {
    callApi("answerQuiz", { quiz: this.quizId, question: this.currentQuestion, answer })
    .then((response:any) => {
      const data:any = response.data;
      if (data.complete) {
        this.questionStage = false;
        this.$emit('end', data.perc);
      } else {
        if (this.currentQuestion === data.currentQuestion) {
          if(this.helpData && this.helpData.length > 0) {
            this.help = this.helpData;
          }
        } else {
          this.help = null;
        }
        this.currentQuestion = data.currentQuestion;
      }
    }).catch((err:any) => {

    }); 
  }
}
</script>