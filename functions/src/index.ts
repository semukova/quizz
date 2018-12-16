import * as functions from 'firebase-functions';
import * as corsLib from 'cors';
import * as admin from 'firebase-admin';

export const ADMIN_IDS: string[] = [
  "O7HvI8k67CRlKH0aX9JUdDeXVAu1",
  "SlEZqM7lWLWFN3mcddjZWEniMub2",
  "wHSKVnHp14MlXTbvIC8htQV11653",
];

admin.initializeApp();

const cors = corsLib({ origin: true });
const db = admin.database();


async function calcUserPoints(user_id:string, quiz_id:string) {
  const userData:any = await getUserData(user_id);
  if(!userData.history) {
    return 0;
  }
  const quizHistory:any = userData.history.find((q:any) => {
    return q.key === quiz_id;
  });
  if(!quizHistory) {
    return 0;
  }
  return quizHistory.questions.map((q:any) => {
    const time:number = parseFloat(
      ((q.stop - q.start) / 1000 / 60).toFixed(2),
    );
    const score: number = parseFloat(
      ((4 - q.attempts) / time).toFixed(3)
    );
    return score;
  }).reduce((a, b) => a + b, 0);
}

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
 * @param {any} quiz
 * @returns
 */
async function startQuiz(user:string, id:string, quiz:any) {
  let userData:any = await getUserData(user);
  if (userData.current) {
    throw new Error(`Quizz ${userData.current.key} already started`);
  }

  await clearQuizHistory(user, id);

  userData = await getUserData(user);

  userData.current = {
    key: id,
    question: 0,
  };
  if (!userData.history) {
    userData.history = [];
  }
  
  userData.history.push({
    key:id,
    quiz_text: quiz.text,
    complete: false,
    questions:[{
      key: 0,
      attempts: 0,
      start: Date.now(),
      stop: 0,
      text: quiz.questions[0].text,
    }]   
  });

  await markQuizBusy(user, id);

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
    return q.key === quiz && q.complete === false;
  });
  quizHistory.questions[userData.current.question].stop = Date.now();
  if (quizzData.questions.length > quizHistory.questions.length) {
    userData.current.question += 1; // next question
    quizHistory.questions.push({
      key: userData.current.question,
      attempts: 0,
      start: Date.now(),
      stop: 0,
      text: quizzData.questions[userData.current.question].text,
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
    return q.key === quiz && q.complete === false;
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

async function createDefaultUserData(user:string, email:string) {
  const data = {
    email,
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

async function getUserQuizzes(user:string, data:any) {
  let userData:any = await getUserData(user);
  if(!userData) {
    userData = await createDefaultUserData(user, data.email);
  }
  const busyQuizzes:string[] = await getUserQuizBusy(user);
  let quizzzes = await getAllQuizzes();
  quizzzes = quizzzes.filter((quiz) => {
    return busyQuizzes.indexOf(quiz.key) === -1;
  });
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

async function markQuizBusy(user:string, quiz:string) {
  return new Promise((res, rej) => {
    db.ref(`busy/${user}`)
    .push({ busy: quiz })
    .then((data:any) => {
      res(data);
    });
  });
}

async function releaseQuiz(user:string, quiz:string) {
  return new Promise((res, rej) => {
    db.ref(`busy/${user}`)
    .once("value", (result:any) => {
      const data:any = result.val();
      if(!data) {
        return res(false);
      }
      let key = null;
      const dKeys = Object.keys(data);
      for (const k of dKeys) {
        if(data[k].busy === quiz) {
          key = k;
          break;
        }
      }
      if (key) {
        db.ref(`busy/${user}/${key}`)
        .remove()
        .then((r:any) => {
          res(r);
        })
        .catch(rej);
      }
    }).catch(rej);
  });
}

async function getUserQuizBusy(user:string): Promise<string[]> {
  return new Promise<string[]>((res, rej) => {
    db.ref(`busy/${user}`)
    .once("value", (data:any) => {
      if(!data.val()) {
        res([]);
      } else {
        const list = data.val();
        res(Object.keys(data.val()).map((k:string) => {
          return list[k].busy;
        }));
      }
    }).catch(rej);
  });
}

async function clearQuizHistory(user:string, quiz:string) {
  return new Promise((res, rej) => {
    db.ref(`users/${user}`)
    .once("value", (history:any) => {
      const data = history.val();
      if(!data) {
        return res(false);
      }
      if(!data.history) {
        return res(false);
      }

      data.history = data.history.filter((i) => {
        return i.key !== quiz;
      });

      console.log(data);

      db.ref(`users/${user}`)
      .set(data)
      .then(()=>{ res(true); }).catch(rej);
    })
    .catch(rej);
  });
}

exports.releaseQuiz = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (!req.get('Authorization')) {
      return res.status(401).send(`Unauthorized`);
    }
    const tokenId = req.get('Authorization').split('Bearer ')[1];
    const quiz_id:string = req.body.quiz_id;
    const user_id:string = req.body.user_id;
    return admin.auth().verifyIdToken(tokenId)
      .then(async (decoded) => {

        if(ADMIN_IDS.indexOf(decoded.uid) === -1) {
          throw new Error(`Restricted area`);
        }

        try {
          const release = await releaseQuiz(user_id, quiz_id);
          res.status(200).send(release);
        } catch (error) {
          res.status(401).send(error.message);
        }
      }).catch((err) => res.status(401).send(err));
  });
});

exports.quizzesList = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (!req.get('Authorization')) {
      return res.status(401).send(`Unauthorized`);
    }
    const tokenId = req.get('Authorization').split('Bearer ')[1];
    return admin.auth().verifyIdToken(tokenId)
      .then(async (decoded) => {
        try {
          const quizzes = await getUserQuizzes(decoded.uid, decoded);
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
          const quiz = await getQuizz(id);
          await startQuiz(decoded.uid, id, quiz);
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
            const perc:number = await calcUserPoints(decoded.uid, id);
            res.status(200).send({
              perc,
              complete : true,
             });
          }
        } catch (error) {
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

        if(ADMIN_IDS.indexOf(decoded.uid) === -1) {
          throw new Error(`Restricted area`);
        }

        db.ref(`users`).once('value', (data:any) => {
          const all = data.val();
          res.status(200).send(all);
        }).catch((err) => res.status(401).send(err));
      }).catch((err) => res.status(401).send(err));
  });
});
