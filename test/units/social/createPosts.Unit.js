process.env.NODE_ENV = 'test';

const Config = global.Config;

const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();
const async = require('async');

const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));

module.exports.setup = function(finish)
{
    let addMetadataToFoldersUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/metadata/addMetadataToFolders.Unit.js"));

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
