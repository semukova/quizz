<template>
  <div class="container">
    <h3>Войти</h3>
    <form class="form">
      <div class="form-group">
        <label for="email">Email</label>
        <input class="form-control" id="email" type="text" v-model="email" placeholder="Email"><br>
      </div>
      <div class="form-group">
        <label for="password">Пароль</label>
        <input class="form-control" id="password" type="password" v-model="password" placeholder="Password"><br>
      </div>
      <button class="btn btn-success btn-sm" @click="onLoginClick">Вход</button>
    </form>
    <div class="form-group">
      <p>Нужен аккаунт ? <router-link class="btn btn-primary btn-sm" to="/sign-up">Создать</router-link></p>
      <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{error}}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Prop, Vue, Emit } from 'vue-property-decorator';
import { IQuestionData } from "../types";
import { DEFAULT_AUTH_DOMAIN } from "@/constants";
import firebase from 'firebase';

@Component
export default class Login extends Vue {
  email:string = "";
  password:string = "";
  error:string = "";
 
  onLoginClick() {
    firebase.auth().signInWithEmailAndPassword(this.email, this.password).then(
      (user) => {
        this.error = '';
        this.$router.replace('home')
      },
      (err) => {
        this.error = err.message;
      }
    );
  }
}
</script>