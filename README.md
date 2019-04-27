# CALA

## Project structure

The application consists of a client application and a sever all written in JavaScript in one code-base - based on node.js 10.x.

1. Client:
    * Written in Vue.js 2.x and contained in the ```frontend``` folder.
    * This project uses an API to access the data and doesn't know anything specific about a server.
1. Server:
    * The server only provides an API which the Vue client application is run independently on.
    * It serves for all applications only the ```public/index.html``` which is the compilation target for the Vue application entry-point.
    * Any further routing is done by the Vue-router.
    
### Client-Server communication

1. The api contains two ```upload``` routes file upload and all other data is queried via GraphQL 
which can be accessed from any Vue component via ```this.$query(...)```.
    * In development mode an UI for testing/building GraphQL queries is provided via ```http://localhost:3000/graphql/v1```. This UI also allow the exploration that the server provides.
1. If needed also REST queries can executed via ```this.$http.[method]``` which just holds an [axios](https://github.com/axios/axios) instance.
1. An instance of socket.io is provided on the client which all Vue-components can access via ```this.$socket``` which allows a real time communication with the server, i.e. to push data to the clients.

## Development

1. To auto-recompile during development and see the current debug-messages you need to run two different commands in two terminal:
    1. Client: ```npm run client```.
    1. Server: ```npm run server```.
    
Both commands will take care of auto-recompilation and setting the environment variables.

## Deployment

1. Setup only requires a environment with node.js >= 10.x.
1. Copy the ```config.default.json``` to ```config.json``` and define the API keys and other config there. 
1. If you haven't defined a specif Azure node.js version you can define the version via: Azure Portal -> application settings -> add: WEBSITE_NODE_DEFAULT_VERSION 10.15.1
1. Since ```npm start``` is auto-executed the command first deploys the client application to the ```public/**```folder (beware it deleted the whole folder)
and starts the server with ```nodemon``` to make sure that when a server-side crash occurs that the server is auto-restarted.