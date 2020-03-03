module.exports = {
  "trainingKey": process.env.TRAINING_KEY,
  "predictionKey": process.env.PREDICTION_KEY,
  "predictionResourceId": process.env.PREDICTION_RESOURCE_ID,
  "projectId": process.env.PROJECT_ID,
  "endPoint": process.env.ENDPOINT,
  "ssl": {
    "cert": "./config/ssl/cert.pem",
    "key": "./config/ssl/key.pem"
  },
  "log": "./logs/[time]_server.log"
};