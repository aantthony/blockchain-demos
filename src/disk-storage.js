const {
  readFile,
  writeFile,
  readdir,
  mkdirSync,
} = require('fs');

module.exports = function createDiskStorage(directory) {
  directory = directory || './';
  // Remove trailing '/' for consistency:
  directory = directory.replace(/\/$/, '');
  directory += '/data';

  try {
    mkdirSync(directory, {recursive: true});
  } catch (ex) {
    //
  }

  function readJSON(path) {
    return new Promise((resolve, reject) => {
      return readFile(path, (err, data) => {
        if (err) return resolve(null);
        resolve(JSON.parse(data));
      });
    });
  }

  return {
    get(key) {
      return readJSON(directory + '/' + key + '.json');
    },
    put(key, value) {
      writeFile(directory + '/' + key + '.json', JSON.stringify(value), () => null);
    },
  };
}
