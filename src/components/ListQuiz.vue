<template>
  <div class="container">
    <h1>Список учебных тестов</h1>
    <router-link :to="'/quizzes/add'" class="btn btn-warning btn-sm">Добавить учебный тест</router-link>
    <br>
    <br>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Название</th>
          <th>Количество вопросов</th>
          <th colspan="2">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item of items" :key="item['key']">
          <td>{{ item.text }}</td>
          <td>{{ item.questions.length }}</td>
          <td>
            <router-link :to="'/quizzes/edit/' + item['key']" class="btn btn-warning">Редактировать</router-link>
          </td>
          <td>
            <button @click="deleteItem(item['key'])" class="btn btn-danger">Удалить</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'vue-property-decorator';
import { IQuestionData } from "../types";
import { db } from '../db';

@Component
export default class ListQuiz extends Vue {
  items: any[] = [];

  updateList() {
    this.items = [];
    db.ref(`quizzes`).once('value', (data:any) => {
      const items:any[] = data.val();
      const keys:string[] = Object.keys(items);
      keys.forEach((k:any) => {
        items[k].key = k;
        this.items.push(items[k]); 
      });
    });
  }

  created() {
    this.updateList();
  }

  deleteItem(id:string) {
    db.ref(`quizzes`).child(id).remove();
    this.updateList();
  }
}
</script>