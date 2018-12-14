<template>
  <div class="container">
    <h3>Let's create a new account !</h3>
    <form class="form">
      <div class="form-group">
        <label for="email">Email address</label>
        <input class="form-control" id="email" type="text" v-model="email" placeholder="Email"><br>
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input class="form-control" id="password" type="password" v-model="password" placeholder="Password"><br>
      </div>
      <button class="btn btn-success btn-sm" @click="onSignUpClick">Sign Up</button>
    </form>
    <div class="form-group">
      <span>or go back to <router-link to="/login">login</router-link>.</span>
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

import firebase from 'firebase';

@Component
export default class SignUp extends Vue {
  email:string = "";
  password:string = "";
  error:string = "";
  onSignUpClick() {
    firebase.auth().createUserWithEmailAndPassword(this.email, this.password).then(
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