#!/usr/bin/env bash

sudo npm install -g node-sass
sudo npm install -g cross-env

echo ------------------------------------
echo Building custom Bootstrap CSS
echo ------------------------------------

cd ./frontend/src/assets/css/
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

cd ../../../../../
