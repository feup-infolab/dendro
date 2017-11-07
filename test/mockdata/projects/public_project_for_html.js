const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;
const fileUtils = require(Pathfinder.absPathInTestsFolder('utils/file/fileUtils.js'));

const publicProjectHandle = 'publicprojecthtmlcreatedbydemouser1';

const projectData = {
    creator: 'http://' + Config.host + '/user/demouser1',
    title: 'This is a public test project with handle ' + publicProjectHandle + ' and created by demouser1',
    description: 'This is a test project description',
    publisher: 'UP',
    language: 'En',
    coverage: 'Porto',
    handle: publicProjectHandle,
    privacy: 'public',
    backup_path: fileUtils.getFilePath('/mockdata/projects/projectBackups/publicprojecthtmlcreatedbydemouser1.zip')
};

module.exports = projectData;
