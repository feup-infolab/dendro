#!/usr/bin/env bash

rm isolate-0xn*.log
rm processed.txt
time npm run profile
node --prof-process isolate*.log > processed.txt
cat processed.txt
