const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const mysql = Config.getMySQLByID();

let Event = function (type, postURI, userURI, projectURI)
{
    this.type = type;
    this.postURI = postURI;
    this.userURI = userURI;
    this.projectURI = projectURI;
    return this;
};

Event.prototype.saveToMySQL = function (callback)
{
    const self = this;
    mysql.sequelize.events.create(self).then(() => {
        return callback(null);
    }).catch(err => {
        return callback(err);
    });
};

module.exports.Event = Event;