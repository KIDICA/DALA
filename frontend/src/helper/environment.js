const isProduction = process.env.NODE_ENV === "production";

const baseUrl = window.location.origin.split(/:\d+/)[0];

const urls = {
  http: isProduction ? baseUrl + "/" : baseUrl + ":3000/",
  graphql: isProduction ? "/graphql/v1" : baseUrl + ":3000/graphql/v1",
  socket: baseUrl + ":4200"
};

export default {
  isProduction,
  baseUrl,
  urls
};