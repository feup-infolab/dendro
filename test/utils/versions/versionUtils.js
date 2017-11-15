const chai = require("chai");
const path = require("path");
const chaiHttp = require("chai-http");
const _ = require("underscore");
chai.use(chaiHttp);
const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder(path.join("utils", "null.js"))).isNull;

module.exports.getVersionErrors = function (version, expectedVersion)
{
    let changesType = expectedVersion.change_type;
    let versionChanges = version.changes;
    let expectedChanges = expectedVersion.changes;

    for (let i = 0; i < expectedVersion.changes.length; i++)
    {
        var expectedChange = {
            changedDescriptor: {
                prefix: expectedVersion.changes[i].prefix,
                shortName: expectedVersion.changes[i].shortName
            }
        };

        if (changesType !== "delete")
        {
            expectedChange.newValue = expectedVersion.changes[i].value;
        }
    }

    if (expectedChanges.length !== versionChanges.length)
    {
        return "Length of expected changes do not match received changes";
    }

    if (changesType === "add" || changesType === "update")
    {
        for (var i = 0; i < versionChanges.length; i++)
        {
            let change = versionChanges[i];
            let expectedChange = expectedVersion.changes[i];

            if (change.ddr.changeType !== changesType)
            {
                return "Type of change does not match expected value. " + change.ddr.changeType + " EXPECTED" + changesType;
            }

            if (change.ddr.newValue !== expectedChange.value)
            {
                return "Value of change does not match expected value. " + change.ddr.newValue + " " + expectedChange.value;
            }
        }
    }
    else if (changesType === "delete")
    {
        for (var i = 0; i < versionChanges.length; i++)
        {
            let change = versionChanges[i];
            let expectedChange = expectedVersionChanges[i];

            if (isNull(change.oldValue))
            {
                return "The change is of type delete, but system is not showing the previous value!";
            }

            if (!isNull(change.newValue))
            {
                return "The change is of type delete, but system is showing the resource as having a new value. Deletes nave no new value!";
            }

            if (change.changeType !== changesType)
            {
                return "Type of change does not match expected value. " + change.ddr.changeType + " EXPECTED" + changesType;
            }
        }
    }
    else
    {
        return "Changes type not correct! Check your test calls! " + changesType;
    }

    return null;
};
