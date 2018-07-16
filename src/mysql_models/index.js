"use strict";

let fs = require("fs");
let path = require("path");
let Sequelize = require("sequelize");
let basename = path.basename(__filename);
let db = {};
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

let config = {
    username: Config.mySQLAuth.user,
    password: Config.mySQLAuth.password,
    database: Config.mySQLDBName,
    host: Config.mySQLHost,
    dialect: "mysql",
    operatorsAliases: false
};

var sequelize = new Sequelize(config.database, config.username, config.password, config);

fs
    .readdirSync(__dirname)
    .filter(file =>
        (file.indexOf(".") !== 0) && (file !== basename) && (file.slice(-3) === ".js"))
    .forEach(file =>
    {
        var model = sequelize.import(path.join(__dirname, file));
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName =>
{
    if (db[modelName].associate)
    {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
