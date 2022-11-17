#!/bin/bash

function output() {
  printf "\n============================================================"
  printf "\nSONGHILL: $1"
  printf "\n============================================================\n"
}

export SONGHILL_ROOT=/var/www/songhill
cd $SONGHILL_ROOT

output "Updating code"
git pull

output "React - npm run build"
cd $SONGHILL_ROOT/frontend
npm run build

cd -
output "UI update and build complete"

