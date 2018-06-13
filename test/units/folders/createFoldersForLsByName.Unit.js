process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("/utils/item/itemUtils"));
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

const testFolder1 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder1.js"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

let CreateFolders = require(Pathfinder.absPathInTestsFolder("units/folders/createFolders.Unit.js"));
class CreateFoldersForLsByName extends CreateFolders
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(self);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            should.equal(err, null);
            should.not.equal(agent, null);
            projectUtils.getProjectRootContent(true, agent, publicProject.handle, function (err, info)
            {
                let rootsFoldersForProject = info.body;
                should.exist(rootsFoldersForProject);
                let testFolder1Data = _.find(rootsFoldersForProject, function (folder)
                {
                    return folder.nie.title === testFolder1.name;
                });
                should.exist(testFolder1Data);
                itemUtils.createFolder(true, agent, publicProject.handle, testFolder1.name, "folderA", function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.result.should.equal("ok");
                    res.body.new_folder.nie.title.should.equal("folderA");
                    res.body.new_folder.nie.isLogicalPartOf.should.match(appUtils.resource_id_uuid_regex("folder"));
                    itemUtils.createFolder(true, agent, publicProject.handle, testFolder1.name, "folderC", function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        res.body.result.should.equal("ok");
                        res.body.new_folder.nie.title.should.equal("folderC");
                        res.body.new_folder.nie.isLogicalPartOf.should.match(appUtils.resource_id_uuid_regex("folder"));
                        callback(err, res);
                    });
                });
            });
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

module.exports = CreateFoldersForLsByName;
