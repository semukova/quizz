import Vue from "vue";
import firebase from "firebase";
import App from "@/App.vue";
import router from "@/router";
import store from "@/store";
// import { db } from '@/db';

import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "font-awesome/css/font-awesome.css";

Vue.config.productionTip = false;

let app:any = null;

firebase.auth().onAuthStateChanged(() => {
  if (!app) {
    /* eslint-disable no-new */
    app = new Vue({
      router,
      store,
      render: h => h(App)
    }).$mount("#app");
  }
});