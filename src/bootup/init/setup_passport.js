const async = require("async");
const rlequire = require("rlequire");
const slug = rlequire("dendro", "src/utils/slugifier.js");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const User = rlequire("dendro", "src/models/user.js").User;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const MongoClient = require("mongodb").MongoClient;

let session_key = "dendro_" + slug(Config.host) + "_sessionKey",
    csrf = require("csurf"),
    csrfProtection = csrf({cookie: true}),
    cookieParser = require("cookie-parser"),
    expressSession = require("express-session");

const setupPassport = function (app, callback)
{
    app.use(cookieParser(Config.crypto.secret));

    const setupMongoStore = function (callback)
    {
        const MongoStore = require("connect-mongo")(expressSession);

        const expressSessionParameters = {
            secret: Config.crypto.secret,
            genid: function ()
            {
                const uuid = require("uuid");
                return uuid.v4();
            },
            key: session_key,
            cookie: {maxAge: 1000 * 60 * 60 * 24 * 5}, // 5 days max session age
            resave: false,
            saveUninitialized: false
        };

        if (process.env.NODE_ENV !== "test")
        {
            const mongoDBSessionsDBName = slug(Config.mongoDBSessionStoreCollection);

            let url;
            if (Config.mongoDBAuth.username && Config.mongoDBAuth.password && Config.mongoDBAuth.username !== "" && Config.mongoDBAuth.password !== "")
            {
                url = "mongodb://" + Config.mongoDBAuth.username + ":" + Config.mongoDBAuth.password + "@" + Config.mongoDBHost + ":" + Config.mongoDbPort + "/" + mongoDBSessionsDBName + "?authSource=admin";
            }
            else
            {
                url = "mongodb://" + Config.mongoDBHost + ":" + Config.mongoDbPort + "/" + mongoDBSessionsDBName;
            }

            MongoClient.connect(url, function (err, db)
            {
                if (isNull(err))
                {
                    const sessionMongoStore = new MongoStore({db: db});
                    expressSessionParameters.store = sessionMongoStore;
                    app.use(expressSession(expressSessionParameters));

                    if (Config.startup.load_databases && Config.startup.clear_session_store && !isNull(db))
                    {
                        Logger.log_boot_message("Clearing session store!");
                        db.collection(mongoDBSessionsDBName).drop(function (err, result)
                        {
                            if (isNull(err) || err.errmsg === "ns not found")
                            {
                                callback(null);
                            }
                            else
                            {
                                callback(err, result);
                            }
                        });
                    }
                    else
                    {
                        callback(null);
                    }
                }
                else
                {
                    callback(err, db);
                }
            });
        }
    };

    const setupPassport = function (callback)
    {
        const passport = require("passport");
        // set serialization and deserialization methods

        passport.serializeUser(function (user, done)
        {
            done(null, user);
        });
        passport.deserializeUser(function (user, done)
        {
            const deserializedUser = new User(user);
            done(null, deserializedUser);
        });

        app.use(passport.initialize());
        app.use(passport.session());

        app.use(function (req, res, next)
        {
            req.passport = passport;
            next();
        });
        callback(null);
    };

    async.series([
        setupMongoStore,
        setupPassport
    ], function (err)
    {
        callback(err);
    });
};

module.exports.setupPassport = setupPassport;
