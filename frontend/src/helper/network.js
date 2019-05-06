import axios from "axios";
import env from "./environment";

export default {
  query(query) {
    return new Promise((resolve, reject) => {
      axios({
        url: env.urls.graphql,
        method: "POST",
        data: {
          query
        }
      }).then(response => {
        const data = response.data;
        if (data.errors) {
          const errors = data.errors
            .map(error => error.message)
            .join("\n");
          reject(errors);
        } else {
          resolve(data.data);
        }
      }).catch(response => {
        reject(response);
      });
    });
  }
}