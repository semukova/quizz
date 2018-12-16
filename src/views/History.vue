<template>
  <div class="container">
    <h1>Статистика</h1>
    <table class="table">
      <thead>
        <tr>
          <th>Пользователь</th>
          <th>Опрос</th>
          <th>Ответил верно/не верно</th>
          <th>Количество очков</th>
        </tr>  
      </thead>
      <tbody>
        <tr v-for="history of histories" :key="history['key']">
          <td>{{ history.user }}</td>
          <td>{{ history.text }}</td>
          <td>{{ history.success }}/{{ history.fail }}</td>
          <td>{{ history.score }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'vue-property-decorator';
import firebase from 'firebase';

@Component
export default class History extends Vue {
  histories:any[] = [];

  created() {
    
  }
}
</script>