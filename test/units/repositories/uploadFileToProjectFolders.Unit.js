process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const async = require("async");
const path = require("path");
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

const txtMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/txtMockFile.js"));

const b2share = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/b2share"));
const ckan = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/ckan"));
const dspace = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/dspace"));
const eprints = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/eprints"));
const figshare = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/figshare"));
const zenodo = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/zenodo"));

const dataToCreateExportConfigs = [b2share, ckan, dspace, eprints, figshare, zenodo];


// chamar a addMetadataToFolders.unit
module.exports.setup = function (project, finish)
{
    let addMetadataToFoldersSingleProjectUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/metadata/addMetadataToFoldersSingleProject.Unit.js"));
    addMetadataToFoldersSingleProjectUnit.setup(project, function (err, results)
    {
        if (err)
        {
            finish(err, results);
        }
        else
        {
            // procurar para todos os projetos as pastas da root e fazer upload de um ficheiro
            /* async.mapSeries(projects, function (project, cb) { */
            console.log("---------- RUNNING UNIT uploadFileToProjectFolders.Unit for: " + project.handle + " ----------");
            unitUtils.start(__filename);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                if (err)
                {
                    cb(err, agent);
                }
                else
                {
                    projectUtils.getProjectRootContent(true, agent, project.handle, function (err, res)
                    {
                        async.mapSeries(res.body, function (folder, cb)
                        {
                            fileUtils.uploadFile(true, agent, project.handle, folder.nie.title, txtMockFile, function (err, res)
                            {
                                fileUtils.downloadFileByUri(true, agent, res.body[0].uri, function (error, res)
                                {
                                    cb(error, res);
                                });
                            });
                        }, function (err, results)
                        {
                            /* cb(err, results); */
                            appUtils.registerStopTimeForUnit(path.basename(__filename));
                            finish(err, results);
                        });
                    });
                }
            });
            /* }, function (err, results) {
                finish(err, results);
            }); */
        }
    });
};
