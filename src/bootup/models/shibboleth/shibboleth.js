const slug = require("slug");
const path = require("path");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const _ = require("underscore");
const fs = require("fs");

class Shibboleth
{
    constructor (shibbolethConfig)
    {
        try
        {
            this.__CALLBACK_URL = shibbolethConfig.CALLBACK_URL;
            this.__ENTRY_POINT = shibbolethConfig.ENTRY_POINT;
            this.__ISSUER = shibbolethConfig.ISSUER;
            this.__SESSION_SECRET = shibbolethConfig.SESSION_SECRET;
            this.__button_text = shibbolethConfig.button_text;

            /*
            this.__idp_cert = shibbolethConfig.idp_cert;
            this.__key = shibbolethConfig.key;
            this.__cert = shibbolethConfig.cert;
            */

            /*
            this.__idp_cert = fs.readFileSync(shibbolethConfig.idp_cert_path);
            this.__key = fs.readFileSync(shibbolethConfig.key_path);
            this.__cert = fs.readFileSync(shibbolethConfig.cert_path);
            */
            this.__idp_cert = fs.readFileSync(shibbolethConfig.idp_cert_path, "utf8");
            this.__key = fs.readFileSync(shibbolethConfig.key_path, "utf8");
            this.__cert = fs.readFileSync(shibbolethConfig.cert_path, "utf8");
            console.log("Done!");
        }
        catch (error)
        {
            throw error;
        }
    }


    /*
    addNewSocket (newSocket)
    {
        let self = this;
        self.__sockets.push(newSocket);
        Logger.log("info", "Num connectedSockets for user " + self.__userUri + " : " + self.__sockets.length);
    };
    */

    registerAuthenticationRoutes (app, passport)
    {
        let saml = require("passport-saml");
        let samlStrategy = new saml.Strategy({
            // URL that goes from the Identity Provider -> Service Provider
            callbackUrl: this.__CALLBACK_URL,
            // URL that goes from the Service Provider -> Identity Provider
            entryPoint: this.__ENTRY_POINT,
            // Usually specified as `/shibboleth` from site root
            issuer: this.__ISSUER,
            identifierFormat: null,
            // Service Provider private key
            decryptionPvk: this.__key,
            // Service Provider Certificate
            privateCert: this.__key,
            // Identity Provider's public key
            cert: this.__idp_cert,
            validateInResponseTo: false,
            disableRequestedAuthnContext: true
        }, function(profile, done) {
            return done(null, profile);
        });

        passport.use(samlStrategy);

        function ensureAuthenticated(req, res, next) {
            if (req.isAuthenticated())
                return next();
            else
                return res.redirect("/Shibboleth/login");
        }

        app.get("/Shibboleth",
            ensureAuthenticated,
            function(req, res) {
                res.send('Authenticated');
            }
        );

        app.get("/Shibboleth/login",
            passport.authenticate("saml", { failureRedirect: "/login/fail" }),
            function (req, res) {
                res.redirect("/");
            }
        );

        app.post("/Shibboleth/login/callback",
            passport.authenticate("saml", { failureRedirect: "/login/fail" }),
            function(req, res) {
                console.log("will check req.user!!");
                console.log(req.user);
                //TODO login or register user in DENDRO here
                res.redirect("/");
            }
        );

        app.get("/Shibboleth/login/fail",
            function(req, res) {
                console.log("Login failed!");
                res.status(401).send("Login failed");
            }
        );

        app.get('/Shibboleth.sso/Metadata',
            function(req, res) {
                res.type('application/xml');
                res.status(200).send(samlStrategy.generateServiceProviderMetadata(this.__cert));
            }
        );
    }
}

module.exports.Shibboleth = Shibboleth;
