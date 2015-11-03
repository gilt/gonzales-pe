#!/bin/bash

printf "\n\
-----------------------\n\
 Building source files\n\
-----------------------\n\n"
./node_modules/.bin/babel --loose all --compact false --comments true --blacklist spec.functionName src --out-dir lib
