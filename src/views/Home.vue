<template>
  <div class="container">
    <Quiz 
      v-if="currentQuiz"
      :quiz="currentQuiz"
      v-on:end="handleEnd">
      <div slot="intro" slot-scope="props">
        This is my custom quiz header for {{props.title}}.
      </div>
      <div slot="results" slot-scope="props">
        <h1>WOWOWOW!</h1> 
          You got {{props.correct}} right out of 
          {{props.length}} questions. 
        Your percentage is {{props.perc}}%.
      </div>
    </Quiz>
    <br>
    <table v-if="!currentQuiz" class="table">
      <thead>
        <tr>
          <th>Quiz</th>
          <th>Questions count</th>
          <th>Action</th>
        </tr>  
      </thead>
      <tbody>
        <tr v-for="quiz of quizzes" :key="quiz['key']">
          <td>{{ quiz.text }}</td>
          <td>{{ quiz.questions.length }}</td>
          <td>
            <button @click="startQuiz(quiz['key'])" class="btn btn-success">Start</button>
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
    this.updateList();
  }

  handleEnd() {
    this.currentQuiz = null;
  }

  updateList() {
    this.quizzes = [];
    db.ref(`quizzes`).once('value', (data:any) => {
      const items:any[] = data.val();
      const keys:string[] = Object.keys(items);
      keys.forEach((k:any) => {
        items[k].key = k;
        this.quizzes.push(items[k]); 
      });
    });
    const user:any = firebase.auth().currentUser;
    db.ref(`current/${user.uid}`).once('value', (data:any) => {
      const current = data.val();
      if (current) {
        this.currentQuiz = current;
      }
    });
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
    const user:any = firebase.auth().currentUser;
    const token = user.getIdToken();
    token.then((tk:any) => {
      axios.post(
        "https://us-central1-test-b95ec.cloudfunctions.net/startQuiz",
       // "http://localhost:5000/test-b95ec/us-central1/startQuiz",
        { quiz: id },
        {
          headers: {
            "Authorization": `Bearer ${tk}`
          }
        }
      )
      .then((response:any) => {
        if (response.data) {
          this.currentQuiz = response.data;
        }
      }).catch((err) => {
        console.log(err);
      });   
    })
  }
}
</script>