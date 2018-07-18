const rlequire = require("rlequire");

const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;

const dbMySQL = rlequire("dendro", "src/mysql_models/index");
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

let Event = function (object, type, postURI, userURI)
{
    if (!isNull(object))
    {
        if (!isNull(type) && !isNull(postURI) && !isNull(userURI))
        {
            throw new Error("invalid constructor call for Event class!");
        }

        Event.baseConstructor.call(this, object);
        const self = this;

        self.copyOrInitDescriptors(object);

        const now = new Date();
        self.ddr.created = now.toISOString();

        return self;
    }
    else
    {
        this.typeName = type;
        this.postURI = postURI;
        this.userURI = userURI;
        return this;
    }
};

Event.prototype.saveToMySQL = function (callback)
{
    const self = this;
    dbMySQL.event_types.findAll({
        where: {
            name: self.typeName
        }
    }).then(res =>
    {
        self.typeId = res[0].dataValues.id;
        dbMySQL.events.create(self).then(() =>
            callback(null)).catch(err =>
            callback(err));
    });
};

Event.prototype.deleteFromMySQL = function (callback)
{
    const self = this;
    dbMySQL.event_types.findAll({
        where: {
            name: self.typeName
        }
    }).then(res =>
    {
        self.typeId = res[0].dataValues.id;
        dbMySQL.events.destroy({
            where: {
                postURI: self.postURI,
                userURI: self.userURI,
                typeId: self.typeId
            }
        }).then(() =>
            callback(null)).catch(err =>
            callback(err));
    });
};

Event = Class.extend(Event, Resource, "ddr:Event");

module.exports.Event = Event;
