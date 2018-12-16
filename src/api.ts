import firebase from "firebase";
import axios from "axios";

const API_ENDPOINT: string = process.env.NODE_ENV === "development" ?
"http://localhost:5000/test-b95ec/us-central1/" :
"https://us-central1-test-b95ec.cloudfunctions.net/";

async function callApi(method:string, data:any):Promise<any> {
  return new Promise<any>((res, rej) => {
    const user:any = firebase.auth().currentUser;
    const token:any = user.getIdToken();
    token.then((tk:any) => {
      axios.post(
        `${API_ENDPOINT}${method}`,
       data,
        {
          headers: {
            "Authorization": `Bearer ${tk}`
          }
        }
      )
      .then(res).catch(rej);
    }).catch(rej);
  });
}

export default callApi;
