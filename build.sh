#!/usr/bin/env bash

echo ------------------------------------
echo Building custom Bootstrap CSS
echo ------------------------------------
cd ./frontend/public/style
git clone https://github.com/twbs/bootstrap.git
cd bootstrap
git pull
npm install
cp ../_variables.scss scss/_variables.scss
npm run css