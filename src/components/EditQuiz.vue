<template>
<div class="container">
  <div class="card">
      <div class="card-header"> 
        <h3>Редактировать тест учебной деятельности</h3>
      </div>
      <div class="card-body">
          <form @submit.prevent="updateItem">
            <div class="form-group">
              <label for="title">Название:</label>
              <input id="title" type="text" v-model="text" class="form-control">
            </div>
            <div class="row-question" v-for="(question, q_key, q_index) in questions" :key="`${q_key}`">
              <h4>Вопрос № {{ q_key + 1 }}</h4>
              <input @click="onDelQuestionClick(q_key)" type="button" value="Удалить" class="btn btn-danger btn-sm">
              <div class="form-group">
                <label for="text">Текст:</label>
                <input id="text" type="text" v-model="question.text" class="form-control">
              </div>
              <div class="form-group">
                <label :for="'type'+q_index">Тип:</label>
                <div class="select">
                  <select :id="'type'+q_index" v-model="question.type" class="custom-select">
                    <option disabled value="">Выберите тип</option>
                    <option value="tf">Да/Нет</option>
                    <option value="mc">Список</option>
                  </select>
                </div>
              </div>
              <label for="answer">Подсказка:</label>
              <input id="help" type="text" v-model="question.help" class="form-control">
              <label for="answer">Ответ:</label>
              <input id="answer" type="text" v-model="question.answer" class="form-control">
              <div v-if="question.type === 'mc'">
                <p>Варианты для выбора (включая правильный)</p>
                <div class="row-question" v-for="(answer, a_key, a_index) in question.answers" :key="`${a_key}`">
                  <label :for="'answer'+q_index+'_'+a_index">Вариант №{{a_key+1}}:</label>
                  <input :id="'answer'+q_index+'_'+a_index" type="text" v-model="answer.value" class="form-control">
                  <input @click="onDelAnswerClick(q_key, a_index)" type="button" value="Удалить ответ" class="btn btn-danger btn-sm">
                </div>
                <br>
                <div class="form-group">
                  <input @click="onAddAnswerClick(q_key)" type="button" value="Добавить ответ" class="btn btn-success btn-sm">
                </div>
              </div>
            </div>
            <hr>
            <div class="form-group">
              <div class="btn-group" role="group">
                <input @click="onAddQuestionClick" type="button" value="Добавить вопрос" class="btn btn-success btn-sm">
                <input type="submit" value="Сохранить" class="btn btn-primary btn-sm">
              </div>
            </div>
          </form>
      </div>
  </div>
</div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'vue-property-decorator';
import { IQuestionData } from "../types";
import { db } from '../db';

@Component
export default class EditQuiz extends Vue {
  title:string = "";
  text:string = "";
  help:string = "";
  questions: IQuestionData[] = [];

  created() {
    db.ref(`quizzes/${this.$route.params.id}`).once('value', (data:any) => {
      const item:any = data.val();
      this.title = item.title;
      this.text = item.text;
      this.questions = item.questions;
    });
  }

  onAddQuestionClick() {
    this.questions.push({
      text: "",
      help: "",
      type: "tf",
      answer: "",
      answers: [],
    });
  }

  onAddAnswerClick(q_index:number) {
    if (this.questions[q_index]) {
      this.questions[q_index].answers.push({
        value: "",
      });
    }
  }

  onDelAnswerClick(q_index:number, a_index:number) {
    this.questions[q_index].answers.splice(a_index, 1);
  }
  
  onDelQuestionClick(a_index:number) {
    this.questions.splice(a_index, 1);
  }
  
  updateItem() {
    db.ref(`quizzes/${this.$route.params.id}`).set({
      title : this.title,
      text: this.text,
      help: this.help,
      questions: this.questions,
    });
    this.$router.push("/quizzes");
  }
}
</script>