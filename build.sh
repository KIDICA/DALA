#!/usr/bin/env bash

echo ------------------------------------
echo Building custom Bootstrap CSS
echo ------------------------------------
cd ./frontend/public/style/bootstrap
git pull
git checkout master
git checkout tags/v4.3.1
git reset --hard
npm install
cp ../cala.scss scss/cala.scss
cp ../_variables.scss scss/_variables.scss
npm run css