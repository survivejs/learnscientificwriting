#!/usr/bin/env bash

set -e # Exit with nonzero exit code if anything fails

if [ -d "book/.git" ]; then
  git -C "book" fetch origin main
  git -C "book" checkout main
  git -C "book" pull --ff-only origin main
else
  git clone -b main "https://github.com/survivejs/scientificwritingbook.git" "book/"
fi
