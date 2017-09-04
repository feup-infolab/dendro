process.env.NODE_ENV = 'test';

const _ = require("underscore");
const chai = require("chai");
const should = chai.should();
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const async = require("async");
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const repositoryUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/repositoryUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

const b2share = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/b2share"));
const ckan = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/ckan"));
const dspace = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/dspace"));
const eprints = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/eprints"));
const figshare = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/figshare"));
const zenodo = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/zenodo"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const privateProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));
const metadataOnlyProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const projects = [publicProject, privateProject, metadataOnlyProject];

const folderExportedCkanNoDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanNoDiffs.js"));
const folderExportedCkanDendroDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanDendroDiffs.js"));
const folderExportedCkanCkanDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanCkanDiffs.js"));
const folders = [folderExportedCkanNoDiffs, folderExportedCkanDendroDiffs, folderExportedCkanCkanDiffs];

const dataToCreateExportConfigs = [b2share, ckan, dspace, eprints, figshare, zenodo];
let ckanData;

function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}

//TODO chamar a createExportToRepositoriesConfigs.Unit.js
module.exports.setup = function(finish)
{
    let createExportToRepositoriesConfig = requireUncached(Pathfinder.absPathInTestsFolder("units/repositories/createExportToRepositoriesConfigs.Unit.js"));

    createExportToRepositoriesConfig.setup(function (err, results) {
        if(err)
        {
            finish(err, results);
        }
        else
        {
            userUtils.loginUser(demouser1.username,demouser1.password, function (err, agent) {
                if(err)
                {
                    finish(err, agent);
                }
                else
                {
                    repositoryUtils.getMyExternalRepositories(true, agent, function (err, res) {
                        res.statusCode.should.equal(200);
                        res.body.length.should.equal(6);
                        ckanData = _.find(res.body, function (externalRepo) {return externalRepo.dcterms.title === "ckan_local";});
                        should.exist(ckanData);

                        //fazer export de apenas algumas pastas, e de seguida adicionar alterações ckandiffs e dendro diffs a algumas delas(de acordo com os nomes)
                        async.mapSeries(projects, function (project, cb) {
                            userUtils.loginUser(demouser1.username,demouser1.password, function (err, agent) {
                                if(err)
                                {
                                    cb(err, agent);
                                }
                                else
                                {
                                    //TODO export folders folderExportedCkanNoDiffs, folderExportedCkanDendroDiffs folderExportedCkanCkanDiffs
                                    async.mapSeries(folders, function (folder, cb) {
                                        repositoryUtils.exportFolderToRepository(true, project.handle, folder.pathInProject + folder.name, agent, {repository: ckanData}, function (err, res) {
                                            res.statusCode.should.equal(200);
                                            cb(err, res);
                                        });
                                    }, function (err, results) {
                                        cb(err, results);
                                    });
                                }
                            });
                        }, function (err, results) {
                            finish(err, results);
                        });
                    });
                }
            });
        }
    });
};