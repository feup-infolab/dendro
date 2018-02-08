process.env.NODE_ENV = "test";

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
let path = require("path");
const Pathfinder = global.Pathfinder;
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const isNull = require(Pathfinder.absPathInSrcFolder(path.join("utils", "null.js"))).isNull;

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3"));

const TestUnit = require(Pathfinder.absPathInTestsFolder("units/testUnit.js"));
class CreateAvatarsForUsers extends TestUnit
{
    static load (callback)
    {
        const usersData = [demouser1, demouser2, demouser3];
        let createUsersUnit = require(Pathfinder.absPathInTestsFolder("units/users/createUsers.Unit.js"));

        createUsersUnit.init(function (err, results)
        {
            if (isNull(err))
            {
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

                    return callback(err, results);
                });
            }
            else
            {
                return callback(err, results);
            }
        });
    }

    static init (callback)
    {
        super.init(callback);
    }
}

module.exports = CreateAvatarsForUsers;
