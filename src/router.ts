import firebase from "firebase";
import Vue from "vue";
import Router from "vue-router";
import Home from "@/views/Home.vue";
import Login from "@/views/Login.vue";
import SignUp from "@/views/SignUp.vue";
import AddQuiz from "@/components/AddQuiz.vue";
import EditQuiz from "@/components/EditQuiz.vue";
import ListQuiz from "@/components/ListQuiz.vue";

Vue.use(Router);

const router:any = new Router({
  routes: [
    {
      path: "/",
      redirect: "/login"
    },
    {
      path: "/login",
      name: "Login",
      component: Login
    },
    {
      path: "/sign-up",
      name: "SignUp",
      component: SignUp
    },
    {
      path: "/home",
      name: "Home",
      component: Home,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: "/quizzes/add",
      name: "AddQuiz",
      component: AddQuiz,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: "/quizzes/edit/:id",
      name: "EditQuiz",
      component: EditQuiz,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: "/quizzes",
      name: "ListQuiz",
      component: ListQuiz,
      meta: {
        requiresAuth: true
      }
    }
  ]
});

router.beforeEach((to:any, from:any, next:any) => {
  const currentUser:any = firebase.auth().currentUser;
  const requiresAuth:any = to.matched.some((record:any) => record.meta.requiresAuth);
  if (requiresAuth && !currentUser) {
    next("/login");
  } else if (!requiresAuth && currentUser) {
    next("/home");
  } else {
    next();
  }
});

export default router;