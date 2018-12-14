<template>
<div class="container">
  <div class="card">
      <div class="card-header"> 
        <h3>Add Quiz</h3>
      </div>
      <div class="card-body">
          <form @submit.prevent="addItem">
            <div class="form-group">
              <label for="title">Title:</label>
              <input id="title" type="text" v-model="text" class="form-control">
            </div>
            <div class="row-question" v-for="(question, q_key, q_index) in questions" :key="`${q_key}`">
              <hr/>
              <div class="form-group">
                <label for="text">Text:</label>
                <input id="text" type="text" v-model="question.text" class="form-control">
              </div>
              <div class="form-group">
                <label :for="'type'+q_index">Type:</label>
                <div class="select">
                  <select :id="'type'+q_index" v-model="question.type" class="custom-select">
                    <option disabled value="">Please choose Workplace</option>
                    <option value="tf">tf</option>
                    <option value="mc">mc</option>
                  </select>
                </div>
              </div>
              <label for="answer">Answer:</label>
              <input id="answer" type="text" v-model="question.answer" class="form-control">
              <div v-if="question.type === 'mc'">
                <div class="row-question" v-for="(answer, a_key, a_index) in question.answers" :key="`${a_key}`">
                  <label :for="'answer'+q_index+'_'+a_index">Answer:</label>
                  <input :id="'answer'+q_index+'_'+a_index" type="text" v-model="answer.value" class="form-control">
                </div>
                <input @click="onAddAnswerClick(q_key)" type="button" value="Add Answer" class="btn btn-success">
              </div>
            </div>
            <div class="form-group">
              <input @click="onAddQuestionClick" type="button" value="Add Question" class="btn btn-success">
            </div>
            <div class="form-group">
              <input type="submit" value="Submit" class="btn btn-primary">
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
export default class AddQuiz extends Vue {
  title:string = "";
  text:string = "";
  questions: IQuestionData[] = [];

  onAddQuestionClick() {
    this.questions.push({
      text: "",
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
  addItem() {
    db.ref("quizzes").push({
      title : this.title,
      text: this.text,
      questions: this.questions,
    });
    this.$router.push("/quizzes");
  }
}
</script>