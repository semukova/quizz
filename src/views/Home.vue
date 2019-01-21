<template>
  <div class="container">
    <h1 v-if="!currentQuiz">Доступные учебные тест</h1>
    <h1 v-if="currentQuiz">Текущий учебный тест</h1>

    <div v-if="result" class="alert alert-warning alert-dismissible fade show" role="alert">
      Молодец, ты прошел тест! Твой балл: {{result}}
      <button @click="onResultClose" type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>

    <Quiz
      v-if="currentQuiz && !result"
      :quiz="currentQuiz"
      v-on:end="handleEnd">
    </Quiz>

    <br>
    <table v-if="!currentQuiz" class="table">
      <thead>
        <tr>
          <th>Название</th>
          <th>Количество вопросов</th>
          <th>Действия</th>
        </tr>  
      </thead>
      <tbody>
        <tr v-for="quiz of quizzes" :key="quiz['key']">
          <td>{{ quiz.text }}</td>
          <td>{{ quiz.questions.length }}</td>
          <td>
            <button @click="startQuiz(quiz['key'])" class="btn btn-success">Начать</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import firebase from 'firebase';
import axios from 'axios';
import { Component, Vue } from 'vue-property-decorator';
import Quiz from '@/components/Quiz.vue'; 
import { db } from '../db';
import callApi from "@/api";

@Component({
  components: {
    Quiz,
  },
})
export default class Home extends Vue {
  error:string = "";
  quizzes: any[] = [];
  currentQuiz: any = null;
  result:any = null;

  created() {
    this.getQuizzesList();
  }

  handleEnd(perc:number) {
    this.result = Math.round(perc);
  }

  onResultClose() {
    this.getQuizzesList();
  }

  onSignOutClick() {
    firebase.auth().signOut()
    .then(
      (user) => {
        this.error = '';
        this.$router.replace('login')
      },
      (err) => {
        this.error = err.message;
      }
    );
  }

  startQuiz(id:any) {
    callApi("startQuiz", { quiz: id })
    .then((response:any) => {
      if (response.data) {
        this.currentQuiz = response.data;
      }
    }).catch((err) => {
      // console.log(err);
    });  
  }

  getQuizzesList() {
    this.quizzes = [];
    callApi("quizzesList", { })
    .then((response:any) => {
      this.quizzes = response.data.list;
      if (response.data.current) {
        this.currentQuiz = response.data.current;
      } else {
        this.currentQuiz = null;
      }
    }).catch((err) => {
      // console.log(err);
    });  
  }
}
</script>