process.env.NODE_ENV = "test";

const rlequire = require("rlequire");

const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
const async = require("async");
chai.use(chaiHttp);

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const itemUtils = rlequire("dendro", "test//utils/item/itemUtils");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");

const testFolder1 = rlequire("dendro", "test/mockdata/folders/testFolder1.js");

const publicProject = rlequire("dendro", "test/mockdata/projects/public_project.js");
const privateProject = rlequire("dendro", "test/mockdata/projects/private_project.js");
const metadataOnlyProject = rlequire("dendro", "test/mockdata/projects/metadata_only_project.js");

const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");

let CreateFolders = rlequire("dendro", "test/units/folders/createFolders.Unit.js");
class CreateFoldersForLsByName extends CreateFolders
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(CreateFoldersForLsByName);
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            should.equal(err, null);
            should.not.equal(agent, null);

            async.map([publicProject, privateProject, metadataOnlyProject], function (project, cb)
            {
                projectUtils.getProjectRootContent(true, agent, project.handle, function (err, info)
                {
                    let rootsFoldersForProject = info.body;
                    should.exist(rootsFoldersForProject);
                    let testFolder1Data = _.find(rootsFoldersForProject, function (folder)
                    {
                        return folder.nie.title === testFolder1.name;
                    });
                    should.exist(testFolder1Data);
                    itemUtils.createFolder(true, agent, project.handle, testFolder1.name, "folderA", function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        res.body.result.should.equal("ok");
                        res.body.new_folder.nie.title.should.equal("folderA");
                        res.body.new_folder.nie.isLogicalPartOf.should.match(appUtils.resource_id_uuid_regex("folder"));
                        itemUtils.createFolder(true, agent, project.handle, testFolder1.name, "folderC", function (err, res)
                        {
                            res.statusCode.should.equal(200);
                            res.body.result.should.equal("ok");
                            res.body.new_folder.nie.title.should.equal("folderC");
                            res.body.new_folder.nie.isLogicalPartOf.should.match(appUtils.resource_id_uuid_regex("folder"));
                            unitUtils.endLoad(CreateFoldersForLsByName);
                            cb(err, res);
                        });
                    });
                });
            }, callback);
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
