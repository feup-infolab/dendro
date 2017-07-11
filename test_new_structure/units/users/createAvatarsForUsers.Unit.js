process.env.NODE_ENV = 'test';

const Config = GLOBAL.Config;

const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();
const async = require('async');
const colors = require('colors');

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3"));

function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}

const start = function () {
    console.log("**********************************************".green);
    console.log("[Create Avatars for Users Unit] Setting up Avatars....".green);
    console.log("**********************************************".green);
};

const end = function () {
    console.log("**********************************************".blue);
    console.log("[Create Avatars for Users Unit] Complete...".blue);
    console.log("**********************************************".blue);
};

module.exports.setup = function (finish) {
    start();
    const usersData = [demouser1, demouser2, demouser3];
    let createUsersUnit = requireUncached(Config.absPathInTestsFolder("units/users/createUsers.Unit.js"));

    createUsersUnit.setup(function (err, results) {
        if (err) {
            end();
            finish(err, results);
        }
        else {
            async.mapSeries(usersData, function (userData, cb) {
                userUtils.loginUser(userData.username, userData.password, function (err, agent) {
                    if (err) {
                        end();
                        return cb(err, agent);
                    }
                    else {
                        userUtils.uploadAvatar(false, agent, userData.avatar, function (err, res) {
                            end();
                            cb(err, res);
                        });
                    }
                });
            }, function (err, results) {
                finish(err, results);
            });
        }
    });
};


