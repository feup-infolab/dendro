process.env.NODE_ENV = 'test';

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const chai = require("chai");
chai.use(require('chai-http'));
const async = require("async");
const path = require('path');

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("/utils/item/itemUtils"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));

const publicProjectData = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProjectData = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProjectData = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));

const publicProjectForHTMLTestsData = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project_for_html.js"));
const metadataOnlyProjectForHTMLTestsData = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project_for_html.js"));
const privateProjectForHTMLTestsData = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project_for_html.js"));

const folder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folder.js"));
const testFolder1 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder1.js"));
const testFolder2 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder2.js"));
const folderDemoUser2 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderDemoUser2.js"));

function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}

module.exports.setup = function (project, finish) {
    let createFoldersSingleProjectUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFoldersSingleProject.Unit.js"));
    const foldersData = createFoldersSingleProjectUnit.foldersData;

    createFoldersSingleProjectUnit.setup(project, function (err, results) {
        if (err) {
            finish(err, results);
        }
        else {
            appUtils.registerStartTimeForUnit(path.basename(__filename));
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                if (err) {
                    finish(err, agent);
                }
                else {
                    async.mapSeries(foldersData, function (folderData, cb) {
                        itemUtils.updateItemMetadata(true, agent, project.handle, folderData.name, folderData.metadata, function (err, res) {
                            cb(err, res);
                        });
                    }, function (err, results) {
                        appUtils.registerStopTimeForUnit(path.basename(__filename));
                        finish(err, results);
                    });
                }
            });
        }
    });
};