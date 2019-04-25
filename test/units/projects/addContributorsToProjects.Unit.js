process.env.NODE_ENV = "test";

const rlequire = require("rlequire");

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const CreateProjectsUnit = rlequire("dendro", "test/units/projects/createProjects.Unit.js");

const projectsData = CreateProjectsUnit.projectsData;

class AddContributorsToProjects extends CreateProjectsUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(self);
        async.mapSeries(projectsData, function (projectData, cb)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                if (err)
                {
                    cb(err, agent);
                }
                else
                {
                    userUtils.addUserAscontributorToProject(true, agent, demouser2.username, projectData.handle, function (err, res)
                    {
                        cb(err, res);
                    });
                }
            });
        }, function (err, results)
        {
            /*
            WITH <http://127.0.0.1:3002/dendro_graph>
            SELECT *
            {
                ?s1 ?p1 ?o1.
                ?s1 dcterms:creator ?creator
            }
            */

            if (isNull(err))
            {
                unitUtils.endLoad(self, function (err, results)
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

(async () => {await require("@feup-infolab/docker-mocha").runSetup(AddContributorsToProjects);})();

module.exports = AddContributorsToProjects;
