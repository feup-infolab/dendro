process.env.NODE_ENV = 'test';

const path = require('path');
const appDir = path.resolve(path.dirname(require.main.filename), '../../..');
const Pathfinder = require(path.join(appDir, 'src', 'models', 'meta', 'pathfinder.js')).Pathfinder;
global.Pathfinder = Pathfinder;
Pathfinder.appDir = appDir;

const Config = require(Pathfinder.absPathInSrcFolder(path.join('models', 'meta', 'config.js'))).Config;
Config.testsTimeout = 120000;
console.log('Running in test mode and the app directory is : ' + Pathfinder.appDir);

global.Config = Config;

global.tests = {};

// uncomment the first time you run the tests after installing dendro
// require(Pathfinder.absPathInTestsFolder("/init/loadOntologiesCache.Test.js"));

// ERROS
require(Pathfinder.absPathInTestsFolder('/routes/projects/import/route.projects.import.Test.js'));
