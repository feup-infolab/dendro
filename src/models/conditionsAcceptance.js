const rlequire = require("rlequire");
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

function ConditionsAcceptance (object)
{
    const self = this;
    ConditionsAcceptance.baseConstructor.call(this, object);

    if (!isNull(object.ddr))
    {
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

ConditionsAcceptance = Class.extend(ConditionsAcceptance, Resource, "ddr:Conditions");

module.exports.ConditionsAcceptance = ConditionsAcceptance;
