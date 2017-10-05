const GitHub = require("github-api");

async function loadGist(id, authCredentials = null) {
  let gist = new GitHub(authCredentials).getGist(id);
  const response = await gist.read().catch(function(error) {
    throw Error(error.response.data.message);
  });
  // if (response.status !== 200) throw Error(response.data.message);
  return response.data;
}

async function loadGistCode(id) {
  let gist = await loadGist(id);
  return gist.files["index.js"].content;
}

// loadGistCode('572fb9500506b48f547de255e5540729').then(console.log)

module.exports = {
  loadGistCode
};
