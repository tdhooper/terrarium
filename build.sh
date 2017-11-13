rm -r build || true
mkdir build
browserify index.js | uglifyjs -cm > build/index.js
cp -f index.html build/index.html
cp -rf styles build/
cp -rf images build/
node version.js
