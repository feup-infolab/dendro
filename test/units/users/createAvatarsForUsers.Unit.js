process.env.NODE_ENV = "test";

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
let path = require("path");
const rlequire = require("rlequire");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2");
const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3");

let createUsersUnit = rlequire("dendro", "test/units/users/createUsers.Unit.js");
class CreateAvatarsForUsers extends createUsersUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(CreateAvatarsForUsers);
        const usersData = [demouser1, demouser2, demouser3];
        async.mapSeries(usersData, function (userData, cb)
        {
            userUtils.loginUser(userData.username, userData.password, function (err, agent)
            {
                if (err)
                {
                    return cb(err, agent);
                }
                userUtils.uploadAvatar(false, agent, userData.avatar, function (err, res)
                {
                    return cb(err, res);
                });
            });
        }, function (err, results)
        {
            if (isNull(err))
            {
                return callback(null);
            }

            unitUtils.endLoad(CreateAvatarsForUsers, callback);
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
}


module.exports = CreateAvatarsForUsers;
