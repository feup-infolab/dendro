process.env.NODE_ENV = "test";

const path = require("path");

const rlequire = require("rlequire");
const async = require("async");
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const repositoryUtils = rlequire("dendro", "test/utils/repository/repositoryUtils.js");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");

const b2share = rlequire("dendro", "test/mockdata/repositories/dataToCreate/b2share");
const ckan = rlequire("dendro", "test/mockdata/repositories/dataToCreate/ckan");
const dspace = rlequire("dendro", "test/mockdata/repositories/dataToCreate/dspace");
const eprints = rlequire("dendro", "test/mockdata/repositories/dataToCreate/eprints");
const figshare = rlequire("dendro", "test/mockdata/repositories/dataToCreate/figshare");
const zenodo = rlequire("dendro", "test/mockdata/repositories/dataToCreate/zenodo");

const dataToCreateExportConfigs = [b2share, ckan, dspace, eprints, figshare, zenodo];

let ClearCkanOrganizationStateUnit = rlequire("dendro", "test/units/repositories/clearCkanOrganizationState.Unit.js");
class CreateExportToRepositoriesConfigs extends ClearCkanOrganizationStateUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(CreateExportToRepositoriesConfigs);
        async.mapSeries(dataToCreateExportConfigs, function (dataConfig, cb)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                if (err)
                {
                    cb(err, agent);
                }
                else
                {
                    repositoryUtils.createExportConfig(true, agent, dataConfig, function (err, res)
                    {
                        cb(err, res);
                    });
                }
            });
        }, function (err, results)
        {
            unitUtils.endLoad(CreateExportToRepositoriesConfigs, callback);
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

module.exports = CreateExportToRepositoriesConfigs;
