process.env.NODE_ENV = 'test';

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();
const async = require('async');

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

module.exports.setup = function(finish)
{
    let addMetadataToFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/metadata/addMetadataToFolders.Unit.js"));

    addMetadataToFoldersUnit.setup(function (err, results) {
        if(err)
        {
            console.error("Error adding metadata to folders Unit");
            console.error((err));
            finish(err, results);
        }
        else
        {
            finish(err, results);
        }
    });
};
