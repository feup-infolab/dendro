process.env.NODE_ENV = 'test';

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const async = require("async");
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const repositoryUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/repositoryUtils.js"));
const ckanUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/ckanUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

const ckan = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/ckan"));
const ckanOrganizationData = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/ckanOrganizationData"));

function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}

module.exports.setup = function (finish) {
    console.log("At clearCkanOrganizationStateUnit");
    let uploadFilesToFoldersUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/repositories/uploadFilesToFolders.Unit.js"));

    uploadFilesToFoldersUnit.setup(function (err, results) {
        if (err) {
            finish(err, results);
        }
        else {
            console.log("Running clearCkanOrganizationDateUnit");
            ckanUtils.deleteAllPackagesFromOrganization(true, agent, ckan, ckanOrganizationData, function (err, data) {
                if(err)
                {
                    finish(err, data);
                }
                else
                {
                    /*ckanUtils.deleteCkanOrganization(true, agent, ckan, ckanOrganizationData, function (err, data) {
                        if(err)
                        {
                            finish(err, data);
                        }
                        else
                        {
                            ckanUtils.createCkanOrganization(true, agent, ckan, ckanOrganizationData, function (err, data) {
                                finish(err, data);
                            })
                        }
                    })*/

                    ckanUtils.createCkanOrganization(true, agent, ckan, ckanOrganizationData, function (err, data) {
                        if(err)
                        {
                            if(data.error.name[0] === "Group name already exists in database")
                            {
                                finish(null, data);
                            }
                            else
                            {
                                finish(err, data);
                            }
                        }
                        else
                        {
                            finish(err, data);
                        }
                    })
                }
            });
        }
    });
};
