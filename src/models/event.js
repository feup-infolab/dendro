const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const mysql = Config.getMySQLByID();

let typeName;

let Event = function (type, postURI, userURI, projectURI)
{
    typeName = type;
    this.postURI = postURI;
    this.userURI = userURI;
    this.projectURI = projectURI;
    return this;
};

Event.prototype.saveToMySQL = function (callback)
{
    const self = this;
    mysql.sequelize.type.findAll({
        where: {
            name: typeName
        }
    }).then(res => {
        self.typeId = res[0].dataValues.id;
        mysql.sequelize.events.create(self).then(() => {
            return callback(null);
        }).catch(err => {
            return callback(err);
        });
    });
};

module.exports.Event = Event;