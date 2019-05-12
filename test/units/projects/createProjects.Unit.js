process.env.NODE_ENV = "test";

const rlequire = require("rlequire");
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");

const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");
const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3");

const publicProject = rlequire("dendro", "test/mockdata/projects/public_project.js");
const metadataOnlyProject = rlequire("dendro", "test/mockdata/projects/metadata_only_project.js");
const privateProject = rlequire("dendro", "test/mockdata/projects/private_project.js");
const projectCreatedByDemoUser3 = rlequire("dendro", "test/mockdata/projects/private_project_created_by_demouser3.js");

const publicProjectForHTMLTests = rlequire("dendro", "test/mockdata/projects/public_project_for_html.js");
const metadataOnlyProjectForHTMLTests = rlequire("dendro", "test/mockdata/projects/metadata_only_project_for_html.js");
const privateProjectForHTMLTests = rlequire("dendro", "test/mockdata/projects/private_project_for_html.js");

const projectsData = [publicProject, metadataOnlyProject, privateProject, publicProjectForHTMLTests, metadataOnlyProjectForHTMLTests, privateProjectForHTMLTests];

let CreateUsersUnit = rlequire("dendro", "test/units/users/createUsers.Unit.js");

class CreateProjects extends CreateUsersUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(CreateProjects);
        async.series([
            function (cb1)
            {
                userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
                {
                    if (isNull(err))
                    {
                        async.mapSeries(projectsData, function (projectData, cb2)
                        {
                            if (err)
                            {
                                cb2(err, agent);
                            }
                            else
                            {
                                projectUtils.createNewProject(true, agent, projectData, function (err, res)
                                {
                                    cb2(err, res);
                                });
                            }
                        },
                        function (err, result)
                        {
                            cb1(err, result);
                        });
                    }
                    else
                    {
                        throw new Error(err);
                    }
                });
            },
            function (cb1)
            {
                userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
                {
                    if (err)
                    {
                        cb1(err, agent);
                    }
                    else
                    {
                        projectUtils.createNewProject(true, agent, projectCreatedByDemoUser3, function (err, res)
                        {
                            cb1(err, res);
                        });
                    }
                });
            }

        ], function (err, results)
        {
            if (isNull(err))
            {
                unitUtils.endLoad(CreateProjects, function (err, results)
                {
                    callback(err, results);
                });
            }
            else
            {
                callback(err, results);
            }
        });
    }
    static init (callback)
    {
        super.init(callback);
    }
    static shutdown (callback)
    {
        super.shutdown(callback);
    }

    static setup (callback, forceLoad)
    {
        super.setup(callback, forceLoad);
    }
}

CreateProjects.projectsData = projectsData;

(async () => {await require("@feup-infolab/docker-mocha").runSetup(CreateProjects);})();

module.exports = CreateProjects;
