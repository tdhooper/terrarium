rm -r build || true
mkdir build
browserify index.js > build/index.js
uglifyjs build/index.js -m -cm -o build/index.js
cp -f index.html build/index.html
cp -rf styles build/
cp -rf images build/
cp -rf audio build/
node version.js
