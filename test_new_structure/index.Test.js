process.env.NODE_ENV = 'test';

GLOBAL.tests = {};

let Config = Object.create(require("../src/models/meta/config.js").Config);
GLOBAL.Config = Config;
Config.initGlobals();

//Config.cache.active = false;

GLOBAL.tests = {};

// require(Config.absPathInTestsFolder("/routes/project/public_project/__administer/routes.project.publicProject.__administer.Test.js"));
require(Config.absPathInTestsFolder("routes/project/public_project/__backup/routes.project.publicProject.__backup.Test.js"));
require(Config.absPathInTestsFolder("routes/project/public_project/__bagit/routes.project.publicProject.__bagit.Test.js"));
require(Config.absPathInTestsFolder("/routes/project/public_project/__descriptors_autocomplete/routes.project.publicProject.__descriptors_autocomplete.Test.js"));
// require(Config.absPathInTestsFolder("routes/project/public_project/__download/routes.project.publicProject.__download.Test.js"));
// require(Config.absPathInTestsFolder("routes/project/public_project/__thumbnail/routes.project.publicProject.__thumbnail.Test.js"));
// require(Config.absPathInTestsFolder("routes/project/public_project/__upload/routes.project.publicProject.__upload.Test.js"));
// require(Config.absPathInTestsFolder("routes/project/public_project/__serve/routes.project.publicProject.__serve.Test.js"));
// require(Config.absPathInTestsFolder("routes/project/public_project/__serve_base64/routes.project.publicProject.__serve_base64.Test.js"));

