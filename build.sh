rm -r build || true
mkdir build
browserify index.js | uglifyjs > build/index.js
cp -f index.html build/index.html
cp -f styles/* build/
node version.js
