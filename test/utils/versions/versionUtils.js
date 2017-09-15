const chai = require("chai");
const path = require("path");
const chaiHttp = require("chai-http");
const _ = require("underscore");
chai.use(chaiHttp);
const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder(path.join("utils", "null.js"))).isNull;

module.exports.validateVersion = function (version, expectedVersion, changesType) {
    let versionChanges = version.changes;
    let expectedChanges = [];

    for(let i = 0; i < expectedVersion.length; i++)
    {
        var expectedChange = {
            changedDescriptor : {
                prefix : expectedVersion.prefix,
                shortName : expectedVersion.shortName
            }
        };

        if(changesType !== "delete" )
        {
            expectedChange.newValue = expectedVersion.value;
        }

        expectedChanges.push(expectedChange);
    }

    if(expectedChanges.length !== versionChanges.length)
    {
        return false;
    }

    if(changesType === "add" || changesType === "update" )
    {
        for(var i = 0; i < versionChanges.length; i++)
        {
            let change = versionChanges[i];
            let expectedChange = expectedVersionChanges[i];

            if(change.newValue !== expectedChange.newValue)
            {
                return false;
            }

            if(change.changeType !== changesType)
            {
                return false;
            }
        }
    }
    else if(changesType === "delete")
    {
        for(var i = 0; i < versionChanges.length; i++)
        {
            let change = versionChanges[i];
            let expectedChange = expectedVersionChanges[i];

            if(isNull(change.oldValue))
            {
                return false;
            }

            if(!isNull(change.newValue))
            {
                return false;
            }

            if(change.changeType !== changesType)
            {
                return false;
            }
        }
    }

    return true;
};
