const GitHub = require("github-api");

/**
 * Creates a GitHub gist and returns its details as a promise.
 * If authCredentials are omitted the gist will created by an anonymous user.
 * @constructor
 * @param {Object} files - Object of files in format { `filename`: { content: `fileContent` }}
 * @param {Boolean} [isPublic] - Should the gist be publicly findable? Default: true.
 * @param {Object} [authCredentials] - Either {username: '', password: ''} or {token: 'OAUTH_TOKEN'}
 */
async function createGist(files, isPublic = true, authCredentials = null) {
  let gist = new GitHub(authCredentials).getGist();
  await gist
    .create({
      public: isPublic,
      description: "Testing",
      files
    })
    .catch(function(error) {
      throw Error(error.response.data.message);
    });
  const response = await gist.read();
  // if (response.status !== 200) throw Error(response.data.message);
  return response.data;
}

module.exports = {
  createGist
};
