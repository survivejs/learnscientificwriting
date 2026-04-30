#!/usr/bin/env bash

set -e # Exit with nonzero exit code if anything fails

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Fetch books repositories
echo
echo "Fetching book repository..."
npm run fetch:book-repository

echo
echo "Done!"
