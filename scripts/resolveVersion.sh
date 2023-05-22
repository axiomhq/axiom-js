#! /bin/bash 

echo "Resolving version number for axiom-js"
# TODO: automate this to get the correct versions respectively
# esm
sed -i 's/AXIOM_VERSION/0.13.0/g' ./packages/js/dist/esm/httpClient.js
# cjs
sed -i 's/AXIOM_VERSION/0.13.0/g' ./packages/js/dist/cjs/httpClient.js

