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

function createFiles(indexContent) {
  return {
    "package.json": {
      content: JSON.stringify(packageFile, null, 2),
      language: "JSON",
      type: "application/json"
    },
    "index.js": {
      content: indexContent,
      language: "Javascript",
      type: "application/javascript"
    },
    "README.md": {
      content: "## Test File\n\nfor patternx",
      language: "Markdown",
      type: "text/plain"
    }
  };
}

module.exports = {
  createFiles
};
