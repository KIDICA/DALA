#!/usr/bin/env bash

# Used by bootstrap build
npm install -g node-sass
# Used to set env variable cross OS.
npm install -g cross-env

echo ------------------------------------
echo Building custom Bootstrap CSS
echo ------------------------------------

# Notice that a build of BS is only possible via git clone.
cd ./src/assets/css/
git clone https://github.com/twbs/bootstrap
cd bootstrap
git pull
git checkout master
git checkout tags/v4.3.1
git reset --hard
npm install

cp ../cala.scss scss/cala.scss
cp ../_variables.scss scss/_variables.scss

npm run css

cd ../../../../
