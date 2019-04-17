const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const db = Config.getDBByID();
const Elements = rlequire("dendro", "src//models/meta/elements.js").Elements;

function ConditionsAcceptance (object, privacy)
{
    const self = this;
    self.addURIAndRDFType(object, "Conditions", ConditionsAcceptance);

    ConditionsAcceptance.baseConstructor.call(this, object);

    if (!isNull(object.ddr))
    {
        if (privacy === "public")
        {
            self.ddr.userAccepted = true;
        }
        if (!isNull(object.ddr.acceptingUser))
        {
            self.ddr.acceptingUser = object.ddr.acceptingUser;
        }

        if (!isNull(object.ddr.dataset))
        {
            self.ddr.dataset = object.ddr.dataset;
        }
        if (!isNull(object.ddr.requestDate))
        {
            self.ddr.requestDate = object.ddr.requestDate;
        }
    }

    return self;
}

ConditionsAcceptance.create = function (data, privacy, callback)
{
    let conditions = new ConditionsAcceptance(data, privacy);
    conditions.save(function (err, result)
    {
        if (isNull(err))
        {
            callback(err, result);
        }
        else
        {
            callback(err, result);
        }
    });
};

ConditionsAcceptance.getCondition = function (user, dataset, callback)
{
    let i = 1;
    let query =
      "SELECT DISTINCT * \n" +
      "FROM [0] \n" +
      "WHERE " +
      "{ \n" +
      "       ?condition ddr:userAccepted ?userAccepted.\n" +
      "       ?condition ddr:acceptingUser [" + i++ + "]. \n" +
      "       ?condition  rdf:type ddr:Conditions.\n" +
      "       ?condition  ddr:dataset [" + i++ + "]. \n" +
      "} \n";

    let variables = [
        {
            type: Elements.types.resourceNoEscape,
            value: db.graphUri
        },
        {
            type: Elements.ontologies.ddr.acceptingUser.type,
            value: user
        },
        {
            type: Elements.ontologies.ddr.dataset.type,
            value: dataset
        }];

    db.connection.executeViaJDBC(query, variables, function (err, regs)
    {
        callback(err, regs);
    });
};

ConditionsAcceptance.getDepositConditions = function (datasetUri, accepted, callback)
{
    let i = 1;
    let query =
    "SELECT DISTINCT * \n" +
    "FROM [0] \n" +
    "WHERE " +
    "{ \n" +
    "       ?condition ddr:userAccepted [" + i++ + "].\n" +
    "       ?condition ddr:acceptingUser ?acceptingUser. \n" +
    "       ?condition rdf:type ddr:Conditions.\n" +
    "       ?condition ddr:dataset [" + i++ + "]. \n" +
    "} \n";

    let variables = [
        {
            type: Elements.types.resourceNoEscape,
            value: db.graphUri
        },
        {
            type: Elements.ontologies.ddr.userAccepted.type,
            value: accepted
        },
        {
            type: Elements.ontologies.ddr.dataset.type,
            value: datasetUri
        }];

    db.connection.executeViaJDBC(query, variables, function (err, regs)
    {
        callback(err, regs);
    });
};

ConditionsAcceptance.changeUserAccess = function (condition, value, callback)
{
    if (value === true)
    {
        condition.ddr.userAccepted = value;
        condition.ddr.dateOfAcceptance = new Date();
        condition.save(function (err, result)
        {
            if (isNull(err))
            {
                callback(err, result);
            }
            else
            {
                callback(err, result);
            }
        });
    }
    else
    {
        ConditionsAcceptance.delete(function (err, result)
        {
            if (isNull(err))
            {
                return callback(null, result);
            }
            return callback(err, result);
        });
    }
};

ConditionsAcceptance = Class.extend(ConditionsAcceptance, Resource, "ddr:Conditions");

module.exports.ConditionsAcceptance = ConditionsAcceptance;
