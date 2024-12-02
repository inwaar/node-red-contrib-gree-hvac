#!/bin/sh

npm install
npm link
npm install -g --unsafe-perm node-red@4

mkdir -p sandbox
cd sandbox
npm link node-red-contrib-gree-hvac
