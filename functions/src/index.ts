import * as functions from 'firebase-functions';
import * as corsLib from 'cors';
import * as admin from 'firebase-admin';

admin.initializeApp();

const cors = corsLib({ origin: true });
const db = admin.database();


/**
 * Get user quize data
 *
 * @param {string} user
 * @returns {*}
 */
async function getUserData(user:string) {
  return new Promise((res, rej) => {
    db.ref(`users/${user}`).once('value', (data:any) => {
      res(data.val());
    }).catch(rej);
  });
}

/**
 * Get all quizzes
 *
 * @returns {*}
 */
async function getAllQuizzes() {
  return new Promise<any[]>((res, rej) => {
    db.ref(`quizzes`).once('value', (data:any) => {
      const quizzes = data.val() || {};
      res(
        Object.keys(quizzes)
        .map((key) => {
          return Object.assign(quizzes[key], { key });
        })
      );
    }).catch(rej);
  });
}

/**
 * Start quizz
 *
 * @param {string} user
 * @param {string} quiz
 * @returns
 */
async function startQuiz(user:string, quiz:string) {
  const userData:any = await getUserData(user);
  if (userData.current) {
    throw new Error(`Quizz ${userData.current.key} already started`);
  }
  userData.current = {
    key: quiz,
    question: 0,
  };
  if (!userData.history) {
    userData.history = [];
  }
  userData.history.push({
    key:quiz,
    complete: false,
    questions:[{
      key: 0,
      attempts: 0,
      start: Date.now(),
      stop: 0,
    }]   
  })
  return new Promise((res, rej) => {
    db.ref(`users/${user}`)
    .set(userData)
    .then(() => {
      res(userData);
    }).catch(rej);
  });
}

/**
 * Get quizz data
 *
 * @param {string} quiz
 * @returns
 */
async function getQuizz(quiz:string) {
  return new Promise((res, rej) => {
    db.ref(`quizzes/${quiz}`).once('value', (data:any) => {
      res(data.val());
    }).catch(rej);
  });
}

function nextQuestion(userData, quiz, quizzData) {
  // check quizz history data
  const quizHistory = userData.history.find((q:any) => {
    return q.key === quiz;
  });
  quizHistory.questions[userData.current.question].stop = Date.now();
  if (quizzData.questions.length > quizHistory.questions.length) {
    userData.current.question += 1; // next question
    quizHistory.questions.push({
      key: userData.current.question,
      attempts: 0,
      start: Date.now(),
      stop: 0,
    });
  } else {
    quizHistory.complete = true;
  }
}

/**
 * User quizz answer
 *
 * @param {string} user
 * @param {string} quiz
 * @param {number} index
 * @param {string} answer
 */
async function answerQuestion(
  user:string,
  quiz:string,
  index:number,
  answer:string
) {
  const quizzData:any = await getQuizz(quiz);
  if(!quizzData) {
    throw new Error(`Quizz ${quiz} not exist`);
  }
  const userData:any = await getUserData(user);
  if (!userData.current) {
    throw new Error(`User quizz not started`);
  }
  if (userData.current.key !== quiz) {
    throw new Error(`Unexpected user quizz index ${index}`);
  }
  if (userData.current.question > quizzData.questions.length) {
    throw new Error(`Quizz ${quiz} completed`);
  }
  const quizHistory = userData.history.find((q:any) => {
    return q.key === quiz;
  });
  // check answer
  const question = quizzData.questions[index];
  if (!quizHistory.questions[index].attempts_history) {
    quizHistory.questions[index].attempts_history = [];
  }
  quizHistory.questions[index].attempts_history.push({
    time: Date.now(),
    value: answer,
  });
  if (question.answer === answer) {
    quizHistory.questions[index].success = true;
    quizHistory.questions[index].attempts += 1;
    nextQuestion(userData, quiz, quizzData);
  } else {
    quizHistory.questions[index].attempts += 1; // next attempt
    if (quizHistory.questions[index].attempts >= 3) {
      quizHistory.questions[index].success = false;
      nextQuestion(userData, quiz, quizzData);
    }
  }
  if(quizHistory.complete) {
    userData.current = null; // clear current
  }
  return new Promise((res, rej) => {
    db.ref(`users/${user}`)
    .set(userData)
    .then(() => {
      res(userData);
    }).catch(rej);
  });
}

async function createDefaultUserData(user:string) {
  const data = {
    key: user,
    history : [],
  };
  return new Promise((res, rej) => {
    db.ref(`users/${user}`)
    .set(data)
    .then(() => {
      res(data);
    }).catch(rej);
  });
}

async function getUserQuizzes(user:string) {
  let userData:any = await getUserData(user);
  if(!userData) {
    userData = await createDefaultUserData(user);
  }
  let quizzzes = await getAllQuizzes();
  if (userData.history) {
    quizzzes = quizzzes.filter((quiz) => {
      return !userData.history.find((h:any) => {
        return h.key === quiz.key;
      });
    })
  }
  let current = null;
  if (userData.current) {
    const quizz = await getQuizz(userData.current.key);
    current = {
      id: userData.current.key,
      data: quizz,
      currentQuestion: userData.current.question
    };
  }
  return {
    current,
    list: quizzzes,
  };
}

exports.quizzesList = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (!req.get('Authorization')) {
      return res.status(401).send(`Unauthorized`);
    }
    const tokenId = req.get('Authorization').split('Bearer ')[1];
    return admin.auth().verifyIdToken(tokenId)
      .then(async (decoded) => {
        try {
          const quizzes = await getUserQuizzes(decoded.uid);
          res.status(200).send(quizzes);
        } catch (error) {
          res.status(401).send(error.message);
        }
      }).catch((err) => res.status(401).send(err));
  });
});

exports.startQuiz = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (!req.get('Authorization')) {
      return res.status(401).send(`Unauthorized`);
    }
    const tokenId = req.get('Authorization').split('Bearer ')[1];
    const id:string = req.body.quiz;
    return admin.auth().verifyIdToken(tokenId)
      .then(async (decoded) => {
        try {
          await startQuiz(decoded.uid, id);
          const quiz = await getQuizz(id);
          res.status(200).send({
            id,
            data: quiz
          });
        } catch (error) {
          res.status(401).send(error.message);
        }
      }).catch((err) => res.status(401).send(err));
  });
});

exports.answerQuiz = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (!req.get('Authorization')) {
      return res.status(401).send(`Unauthorized`);
    }
    const tokenId = req.get('Authorization').split('Bearer ')[1];
    const id:string = req.body.quiz;
    const question:number = parseInt(req.body.question);
    const answer:string = req.body.answer;
    return admin.auth().verifyIdToken(tokenId)
      .then(async (decoded) => {
        try {
          const data:any = await answerQuestion(decoded.uid, id, question, answer);
          if(data.current) {
            res.status(200).send({
              currentQuestion : data.current.question,
            });
          } else {
            res.status(200).send({
              complete : true,
              perc: 0,
            });
          }
        } catch (error) {
          console.log(error);
          res.status(401).send(error.message);
        }
      }).catch((err) => res.status(401).send(err));
  });
});

exports.getHistory = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (!req.get('Authorization')) {
      return res.status(401).send(`Unauthorized`);
    }
    const tokenId = req.get('Authorization').split('Bearer ')[1];
    return admin.auth().verifyIdToken(tokenId)
      .then((decoded) => {
        db.ref(`users`).once('value', (data:any) => {
          const all = data.val();
          res.status(200).send(all);
        }).catch((err) => res.status(401).send(err));
      }).catch((err) => res.status(401).send(err));
  });
});
