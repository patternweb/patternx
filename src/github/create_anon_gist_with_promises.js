const GitHub = require("github-api");

const gh = new GitHub();
let gist = gh.getGist();

gist
  .create({
    public: true,
    description: "My first gist",
    files: {
      "file1.txt": {
        content: "this is a test"
      }
    }
  })
  .then(function(data) {
    let createdGist = data;
    return gist.read();
  })
  .then(function({ data }) {
    let retreivedGist = data;
    console.log(retreivedGist);
  });
