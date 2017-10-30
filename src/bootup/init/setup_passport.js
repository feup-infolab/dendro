const path = require("path");
const slug = require("slug");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const User = require(Pathfinder.absPathInSrcFolder("models/user.js")).User;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;

let session_key = "dendro_" + slug(Config.host) + "_sessionKey",
    csrf = require('csurf'),
    csrfProtection = csrf({cookie: true}),
    cookieParser = require('cookie-parser'),
    expressSession = require('express-session');

const setupPassport = function(app, callback)
{
    app.use(cookieParser(Config.crypto.secret));

    const MongoStore = require('connect-mongo')(expressSession);

    const expressSessionParameters = {
        secret: Config.crypto.secret,
        genid: function ()
        {
            const uuid = require("uuid");
            return uuid.v4()
        },
        key: session_key,
        cookie: {maxAge: 1000 * 60 * 60 * 24 * 5}, //5 days max session age
        resave: false,
        saveUninitialized: false
    };


    let sessionMongoStore;
    if(process.env.NODE_ENV !== "test")
    {
        const mongoDBSessionsDBName = slug(Config.mongoDBSessionStoreCollection, "_");
        sessionMongoStore = new MongoStore(
            {
                "host": Config.mongoDBHost,
                "port": Config.mongoDbPort,
                "db": mongoDBSessionsDBName,
                "url": 'mongodb://' + Config.mongoDBHost + ":" + Config.mongoDbPort + "/" + mongoDBSessionsDBName
            });

        expressSessionParameters.store = sessionMongoStore;
    }

    app.use(expressSession(expressSessionParameters));

    const passport = require('passport');
    //set serialization and deserialization methods

    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    passport.deserializeUser(function(user, done) {
        const deserializedUser = new User(user);
        done(null, deserializedUser);
    });

    app.use(passport.initialize());
    app.use(passport.session());

    app.use(function(req, res, next){
        req.passport = passport;
        next(null, req, res);
    });

    if (Config.startup.load_databases && Config.startup.clear_session_store && !isNull(sessionMongoStore))
    {
        Logger.log_boot_message("info", "Clearing session store!");
        sessionMongoStore.clear(function (err, result)
        {
            callback(err);
        });
    }
    else
    {
        callback(null);
    }
};

module.exports.setupPassport = setupPassport;