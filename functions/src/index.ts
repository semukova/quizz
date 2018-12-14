import * as functions from 'firebase-functions';
import * as corsLib from 'cors';
import * as admin from 'firebase-admin';

admin.initializeApp();

const cors = corsLib({ origin: true });
const db = admin.database();

exports.startQuiz = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (!req.get('Authorization')) {
      return res.status(401).send(`Unauthorized`);
    }
    const tokenId = req.get('Authorization').split('Bearer ')[1];
    return admin.auth().verifyIdToken(tokenId)
      .then((decoded) => {
        const id:string = req.body.quiz;
        db.ref(`quizzes/${id}`)
        .once('value', (data:any) => {
          const playload = {
            id,
            data: data.val(),
          };
          db.ref(`current/${decoded.uid}`)
          .set(playload)
          .then(() => {
            res.status(200).send(playload);
          })
          .catch((err) => res.status(401).send(err));
        }).catch((err) => res.status(401).send(err));   
      })
      .catch((err) => res.status(401).send(err));
  });
});

exports.answerQuiz = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (!req.get('Authorization')) {
      return res.status(401).send(`Unauthorized`);
    }
    const tokenId = req.get('Authorization').split('Bearer ')[1];
    return admin.auth().verifyIdToken(tokenId)
      .then((decoded) => {
        const id:string = req.body.quiz;
        const question:string = req.body.question;
        const answer:string = req.body.answer;
        db.ref(`quizzes/${id}`)
        .once('value', (data:any) => {
          const quiz = data.val();
          db.ref(`history/${decoded.uid}/${id}`).push({
            id, question, answer, date: Date.now(),
          });
          db.ref(`history/${decoded.uid}/${id}`)
          .once("value", (historyData: any) => {
            const count:number = historyData.numChildren();
            if (count >= quiz.questions.length) {
              db.ref(`current`).child(decoded.uid).remove()
              .then(()=>{
                res.status(200).send({
                  complete : true,
                  perc: 0,
                });
              }).catch((err) => res.status(401).send(err));
            } else {
              db.ref(`current/${decoded.uid}`)
              .once("value", (current:any) => {
                const playload: any = current.val();
                playload.currentQuestion = count;
                db.ref(`current/${decoded.uid}`)
                .set(playload)
                .then(() => {
                  res.status(200).send({
                    currentQuestion : count,
                  });
                }).catch((err) => res.status(401).send(err));
              }).catch((err) => res.status(401).send(err));
            }
          }).catch((err) => res.status(401).send(err));
        }).catch((err) => res.status(401).send(err));   
      })
      .catch((err) => res.status(401).send(err));
  });
});