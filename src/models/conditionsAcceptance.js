const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const db = Config.getDBByID();
const Elements = rlequire("dendro", "src//models/meta/elements.js").Elements;

function ConditionsAcceptance (object)
{
    const self = this;
    self.addURIAndRDFType(object, "Conditions", ConditionsAcceptance);

    ConditionsAcceptance.baseConstructor.call(this, object);

    if (!isNull(object.ddr))
    {
        if (!isNull(object.ddr.userAccepted))
        {
            self.ddr.userAccepted = object.ddr.userAccepted;
        }
        if (!isNull(object.ddr.acceptingUser))
        {
            self.ddr.acceptingUser = object.ddr.acceptingUser;
        }

        if (!isNull(object.ddr.dataset))
        {
            self.ddr.dataset = object.ddr.dataset;
        }
        if (!isNull(object.ddr.dateOfAcceptance))
        {
            self.ddr.dateOfAcceptance = object.ddr.dateOfAcceptance;
        }
    }

    return self;
}

ConditionsAcceptance.create = function (data, callback)
{
    let conditions = new ConditionsAcceptance(data);
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

/* ConditionsAcceptance.acceptedCondition = function (user, dataset, callback)
{
    let i = 1;
    let query =
      "SELECT DISTINCT * \n" +
      "FROM [0] \n" +
      "WHERE " +
      "{ \n" +
      "       ?condition ddr:userAccepted [" + i++ + "]. \n" +
      "       ?condition rdf:type ddr:Conditions.\n" +
      "       ?condition ddr:dataset [" + i++ + "]. \n" +

      "} \n";

    let variables = [
        {
            type: Elements.types.resourceNoEscape,
            value: db.graphUri
        },
        {
            type: Elements.ontologies.ddr.acceptingUser.type,
            value: user
        }, {
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
*/
ConditionsAcceptance.prototype.acceptUserAccess = function (callback)
{
    const self = this;
    self.ddr.userAccepted = true;

    self.save(function (err, result)
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

ConditionsAcceptance = Class.extend(ConditionsAcceptance, Resource, "ddr:Conditions");

module.exports.ConditionsAcceptance = ConditionsAcceptance;
