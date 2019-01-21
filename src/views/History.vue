<template>
  <div class="container">
    <h1>Статистика</h1>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Пользователь</th>
          <th>Тест</th>
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
                <div class="btn-group" role="group" aria-label="Basic example">
                  <button @click="onReleaseQuiz(quiz.user_id, quiz.quiz_id)" class="btn btn-success btn-sm">Сброс</button>
                  <button @click="onClickShowAttempts(quiz.user_id, quiz.quiz_id)" class="btn btn-info btn-sm"><i class="fa fa-line-chart" aria-hidden="true"></i>&nbsp;Попытки</button>
                  <button @click="onClickShowTimes(quiz.user_id, quiz.quiz_id)" class="btn btn-info btn-sm"><i class="fa fa-line-chart" aria-hidden="true"></i>&nbsp;Время</button>
                </div>
              </table>
            </td>
          </tr>        
        </template>
      </tbody>
    </table>
    <ModalWindow v-if="showModal" v-on:close="onCloseModal">
      <BarChart ref="barChart" slot="body"></BarChart>
      <h3 slot="header">{{chartTitle}}</h3>
    </ModalWindow>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'vue-property-decorator';
import { mixins } from "vue-class-component";
import firebase from 'firebase';
import callApi from "@/api";
import ModalWindow from "@/components/ModalWindow.vue";
import { Bar } from "vue-chartjs";
import _ from "underscore";

@Component
class BarChart extends mixins(Bar) {
  setData(label:string, labels:string[], data:number[]) {
     this.renderChart({
      labels,
      datasets: [
        {
          data,
          label,
          backgroundColor: '#f87979',
        }
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });   
  }
}

@Component({
  components: {
    ModalWindow,
    BarChart,
  },
})
export default class History extends Vue {
  quizzes:any[] = [];
  showModal:boolean = false;
  cache:any = null;
  chartTitle:string = "";

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
        this.cache = response.data;
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
    }).catch((err) => {});  
  }

  onReleaseQuiz(user_id:string, quiz_id:string) {
    callApi("releaseQuiz", { user_id, quiz_id })
    .then((response:any) => {
      
    }).catch((err) => {}); 
  }

  onClickShowAttempts(user:any, quiz:any) {
    this.showModal = true;
    setTimeout(() => {
      const userData:any = this.cache[user];
      const historyEnt:any = _.findWhere(userData.history, { key : quiz });
      if (historyEnt && historyEnt.complete) {
        const historyData:any = this.mapUserStat(user, historyEnt).questions;
        const labels:string[] = [];
        const data:number[] = [];
        historyData.forEach((element:any) => {
          labels.push(element.key + 1);
          data.push(element.attempts);
        });
        this.chartTitle = "Попытки";
        (<BarChart>this.$refs.barChart).setData("Попытки", labels, data);
      }
    }, 10);
  }

  onClickShowTimes(user:any, quiz:any) {
    this.showModal = true;
    setTimeout(() => {
      const userData:any = this.cache[user];
      const historyEnt:any = _.findWhere(userData.history, { key : quiz });
      if (historyEnt && historyEnt.complete) {
        const historyData:any = this.mapUserStat(user, historyEnt).questions;
        const labels:string[] = [];
        const data:number[] = [];
        historyData.forEach((element:any) => {
          labels.push(element.key + 1);
          data.push(element.time * 60);
        });
        this.chartTitle = "Время";
        (<BarChart>this.$refs.barChart).setData("Время", labels, data);
      }
    }, 10);
  }

  onCloseModal() {
    this.showModal = false;
  }
}
</script>