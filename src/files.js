const packageFile = {
  name: "test",
  version: "0.0.1",
  description: "test description",
  main: "index.js",
  keywords: ["patternx"],
  author: "John Rees <john@bitsushi.com>",
  dependencies: {
    snabbdom: "^0.7.0"
  }
};

module.exports = {
  "package.json": {
    content: JSON.stringify(packageFile, null, 2)
  },
  "index.js": {
    content: `console.log('hello world')`
  },
  "README.md": {
    content: "## Test File\n\nfor patternx"
  }
};
