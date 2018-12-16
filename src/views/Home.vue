<template>
  <div class="container">
    <h1 v-if="!currentQuiz">Доступные опросы</h1>
    <h1 v-if="currentQuiz">Текущий опрос</h1>
    <Quiz 
      v-if="currentQuiz"
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

  created() {
    this.getQuizzesList();
  }

  handleEnd() {
    this.currentQuiz = null;
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
      }
    }).catch((err) => {
      // console.log(err);
    });  
  }
}
</script>