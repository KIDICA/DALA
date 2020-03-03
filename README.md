# DALA

## Getting Started

### Prerequisites

You need to install node.js >= 10.x and create API keys at http://customvision.ai

### Installation

```bash
git clone https://github.com/KIDICA/DALA.git
```

#### Development

To get proper debugging message during development and get automatic recompilation on code changes
you need to start the server and client application in two separate terminals.

Terminal 1

Following environment variables need to be set before the server is launched.

```
TRAINING_KEY
PREDICTION_KEY
PREDICTION_RESOURCE_ID
PROJECT_ID
ENDPOINT
PORT
```

```bash

cd ./server
npm run server
```

Terminal 2

```bash
cd ./client
npm run serve
```

Now open the link in the Terminal 2 window provided.

#### Testing production locally with SSL

If you can't use Android + Firefox you need to run DALA with SSL so the mobile device allows access to the camera.
Also, if you want to test SSL locally you need to generate a self-signed certificate which you can do by just running cert.sh:

```bash
cd ./server/config/ssl/
./cert.sh

Creating self-signed certificate
Generating a RSA private key
......................++++
..........................................................................................................++++
writing new private key to 'key.pem'
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:
State or Province Name (full name) [Some-State]:
Locality Name (eg, city) []:
Organization Name (eg, company) [Internet Widgits Pty Ltd]:
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:localhost
Email Address []:

```

Now run `npm start` from the root this will deploy the Vue app to `/server/public` when the start the server side node.js express app.

#### Real Production

For production you only need to run `./start.sh` and require to have a valid SSL certificate otherwise mobile browser won't allow access to the camera via JavaScript - except of Firefox Mobile on Android.

The command may take a while since a custom build of Bootstrap 4.x is created and the Vue app is compile before the server starts.

## Commands

Command                     | Description
----------------------------|---------------------------------------------------------------------------------------
npm start                   | Start the server in production mode with SSL encryption (builds the Vue app and starts the server).
npm run server              | `cd ./server/npm run server` Start the server. Only needed to run in development mode to get debug message.
npm run client              | `cd ./client/npm run client`. Run the vue-cli client-app development server. Only needed in development to get debug message and on the fly recompilation.

# Project structure

The application consists of two entirely separated apps contained in the `server` and `client` folder.

1. Client:
    * Written in Vue.js 2.x and contained in the `client` folder.
    * This project uses an API to access the data and doesn't know anything specific about a server.
1. Server:
    * The server **only** provides an API which the Vue app consumes.
    * It serves for all queries to the web-server only the `public/index.html` which is the compilation target for the Vue app entry-point.
    * Any further routing is done by the Vue-router.
    * Additionally static files are served from the `/server/uploads` folder.

## Client <-> Server <-> Service communication

1. The server api contains two `/*/uploads` routes for file uploads. Any other data is queried via GraphQL 
which can be accessed from any Vue component via `this.$query("graphql query")`.
    * In development mode an UI for testing/building GraphQL queries is provided via ```http://localhost:3000/graphql/v1```. This UI also allows the exploration of the data-model.
1. If needed also REST queries can executed via `this.$http.[method]` which just holds an [axios](https://github.com/axios/axios) instance.
1. An instance of socket.io is provided on the client which all Vue-components can access via `this.$socket.emit/on` which allows a real time communication with the server, i.e. to push data to the clients.
1. Custom-Vision API: This service is hosting all taken images and providing the prediction services.
 
# Deployment

1. Setup only requires a environment with node.js >= 10.x.
1. Also note: The production should be be served with a valid SSL certificate, otherwise mobile clients won't allow camera access.
1. Set the above mentioned node.js environmental variables.
1. Run `npm start`.

# License

This project has a dual license. It's open-source but you're not allowed to use it commercially without a permission. This license might change in the future.