<template>
  <div class="container">
    <h1>Статистика</h1>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Пользователь</th>
          <th>Опрос</th>
          <th>Время</th>
          <th>Очки</th>
        </tr>  
      </thead>
      <tbody>
        <template v-for="quiz of quizzes">
          <tr :key="'head' + quiz['key']">
            <td>{{ quiz.user }}</td>
            <td>{{ quiz.quiz }}</td>
            <td>{{ quiz.time }}</td>
            <td>{{ quiz.score }}</td>
          </tr>
          <tr :key="'questions' + quiz['key']">
            <td colspan="4">
             <table class="table table-striped">
                <thead>
                  <tr>
                    <th>Вопрос</th>
                    <th>Попыток</th>
                    <th>Время</th>
                    <th>Очки</th>
                  </tr>  
                </thead>
                <tbody>
                  <tr v-for="question of quiz.questions" :key="question['key']">
                    <td>{{ question.text }}</td>
                    <td>{{ question.attempts }}</td>
                    <td>{{ question.time }}</td>
                    <td>{{ question.score }}</td>
                  </tr>
                </tbody>
                <input @click="onReleaseQuiz(quiz.user_id, quiz.quiz_id)" type="button" value="Сброс" class="btn btn-success btn-sm">
              </table>
            </td>
          </tr>        
        </template>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'vue-property-decorator';
import firebase from 'firebase';
import callApi from "@/api";

@Component
export default class History extends Vue {
  quizzes:any[] = [];
  created() {
    this.geHistory();
  }

  mapUserStat(user:any, quiz:any) {
    const questions = quiz.questions.map((q:any) => {
      const time:number = parseFloat(
        ((q.stop - q.start) / 1000 / 60).toFixed(2),
      );
      const score: number = parseFloat(
        ((4 - q.attempts) / time).toFixed(3)
      );
      return {
        time,
        score,
        key: q.key,
        text: q.text,
        attempts: q.attempts,
      };
    });
    let time: number = 0;
    let score: number = 0;
    for(let i = 0; i < questions.length; i++) {
      time += questions[i].time;
      score += questions[i].score;
    }
    return {
      time,
      score,
      questions,
      key: user.key + quiz.key,
      user: user.email,
      quiz: quiz.quiz_text,
      user_id: user.key,
      quiz_id: quiz.key,
    }
  }

  geHistory() {
    callApi("getHistory", { })
    .then((response:any) => {
      if (response.data) {
        const usersKeys = Object.keys(response.data);
        for(let i = 0; i < usersKeys.length; i++) {
          const user:any = response.data[usersKeys[i]];
          if(user.history) {
            for(let j = 0; j < user.history.length; j++) {
              const quiz:any = user.history[j];
              if(quiz.complete) {
                this.quizzes.push(
                  this.mapUserStat(user, quiz),
                )
              }
            }
          }
        }
      }
    }).catch((err) => {
      // console.log(err);
    });  
  }

  onReleaseQuiz(user_id:string, quiz_id:string) {
    callApi("releaseQuiz", { user_id, quiz_id })
    .then((response:any) => {

    }).catch((err) => {
      // console.log(err);
    }); 
  }
}
</script>