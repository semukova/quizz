<template>
  <div id="app">
    <nav v-if="isAuth()" class="navbar navbar-expand-lg navbar-dark bg-dark" style="background-color: #e3f2fd;">
      <router-link class="navbar-brand" to="/">#</router-link>
      <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item active">
            <router-link class="nav-link" to="/">Тесты учебной деятельности <span class="sr-only">(current)</span></router-link>
          </li>
          <li v-if="isAdmin()" class="nav-item">
            <router-link class="nav-link" to="/history">Статистика</router-link>
          </li>
          <li v-if="isAdmin()" class="nav-item">
            <router-link class="nav-link" to="/quizzes">Панель управления</router-link>
          </li>
        </ul>
        <form class="form-inline my-2 my-lg-0">
          <button @click="onSignOutClick" class="btn btn-outline-success my-2 my-sm-0" type="submit">Выйти</button>
        </form>
      </div>
    </nav>
    <router-view/>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'vue-property-decorator';
import { db } from './db';
import { ADMIN_IDS } from '@/constants';
import firebase from 'firebase';
@Component
export default class App extends Vue {
  onSignOutClick() {
    firebase.auth().signOut()
    .then(
      (user) => {
        this.$router.replace('login')
      },
      (err) => {
      }
    );
  }
  isAuth() {
    return firebase.auth().currentUser;
  }
  isAdmin() {
    const user:any = firebase.auth().currentUser;
    return ADMIN_IDS.indexOf(user.uid) !== -1;
  }
}
</script>

<style lang="scss">

</style>
