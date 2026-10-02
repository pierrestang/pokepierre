#!/bin/sh
# Publie le jeu sur GitHub Pages (https://pierrestang.github.io/pokepierre/) : construit le jeu pour cette
# adresse, puis envoie le dossier dist/ sur la branche gh-pages (remplacée à chaque fois).
# Usage : npm run deploy
set -e
cd "$(dirname "$0")/.."
npx vite build --base=/pokepierre/
cd dist
touch .nojekyll                                # fichiers servis tels quels
git init -q -b gh-pages
git add -A
git commit -q -m "Déploiement $(date '+%Y-%m-%d %H:%M')"
git push -f -q https://github.com/pierrestang/pokepierre.git gh-pages
rm -rf .git
echo "Publié : https://pierrestang.github.io/pokepierre/"
