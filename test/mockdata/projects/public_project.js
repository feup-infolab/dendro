const publicProjectHandle = 'publicprojectcreatedbydemouser1';
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;
const fileUtils = require(Pathfinder.absPathInTestsFolder('utils/file/fileUtils.js'));

const projectData = {
    creator: 'http://' + Config.host + '/user/demouser1',
    title: 'This is a public test project with handle ' + publicProjectHandle + ' and created by demouser1',
    description: 'This is a test project description for a public project type',
    publisher: 'UP',
    contact_address: 'Universidade do Porto, Praça dos Leões 31',
    contact_name: 'João Rocha da Silva',
    contact_phone: '+351 930000000',
    contact_email: 'teste@teste.com',
    language: 'En',
    coverage: 'Porto',
    handle: publicProjectHandle,
    privacy: 'public',
    uri: 'http://' + Config.host + '/' + publicProjectHandle,
    backup_path: fileUtils.getFilePath('/mockdata/projects/projectBackups/publicprojectcreatedbydemouser1.zip')
};

module.exports = projectData;
