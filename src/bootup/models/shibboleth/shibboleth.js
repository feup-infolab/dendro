const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const User = require(Pathfinder.absPathInSrcFolder("models/user.js")).User;
const UploadManager = require(Pathfinder.absPathInSrcFolder("/models/uploads/upload_manager.js")).UploadManager;

const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const fs = require("fs");

class Shibboleth
{
    constructor (shibbolethConfig)
    {
        try
        {
            let __callback_url = shibbolethConfig.callback_url;
            let __entry_point = shibbolethConfig.entry_point;
            let __issuer = shibbolethConfig.issuer;
            let __session_secret = shibbolethConfig.session_secret;
            let __button_text = shibbolethConfig.button_text;

            let __idp_cert = fs.readFileSync(shibbolethConfig.idp_cert_path, "utf8");
            let __key = fs.readFileSync(shibbolethConfig.key_path, "utf8");
            let __cert = fs.readFileSync(shibbolethConfig.cert_path, "utf8");

            let __mboxKey = null;
            let __firstNameKey = null;
            let __surnameKey = null;
            let __usernameKey = null;

            /***GETS***/
            this.getCallbackURl = function ()
            {
                return __callback_url;
            };

            this.getEntryPoint = function ()
            {
                return __entry_point;
            };

            this.getIssuer = function ()
            {
                return __issuer;
            };

            this.getSessionSecret = function ()
            {
                return __session_secret;
            };

            this.getButtonText = function ()
            {
                return __button_text;
            };

            this.getIdpCert = function ()
            {
                return __idp_cert;
            };

            this.getKey = function ()
            {
                return __key;
            };

            this.getCert = function ()
            {
                return __cert;
            };

            this.getMBoxKey = function () {
                return __mboxKey;
            };

            this.getFirstNameKey = function () {
                return __firstNameKey;
            };

            this.getSurnameKey = function () {
                return __surnameKey;
            };

            this.getUsernameKey = function () {
                return __usernameKey;
            };

            /***SETS***/
            this.setMBoxKey = function (mboxKey) {
                __mboxKey = mboxKey;
            };

            this.setFirstNameKey = function (firstNameKey) {
                __firstNameKey = firstNameKey;
            };

            this.setSurnameKey = function (surnameKey) {
                __surnameKey = surnameKey
            };

            this.setUsernameKey = function (usernameKey) {
                __usernameKey = usernameKey;
            };
        }
        catch (error)
        {
            throw error;
        }
    }

    registerAuthenticationRoutes(app, passport)
    {
        const self = this;
        let saml = require("passport-saml");
        let samlStrategy = new saml.Strategy({
            // URL that goes from the Identity Provider -> Service Provider
            callbackUrl: self.getCallbackURl(),
            // URL that goes from the Service Provider -> Identity Provider
            entryPoint: self.getEntryPoint(),
            // Usually specified as `/shibboleth` from site root
            issuer: self.getIssuer(),
            identifierFormat: null,
            // Service Provider private key
            decryptionPvk: self.getKey(),
            // Service Provider Certificate
            privateCert: self.getKey(),
            // Identity Provider's public key
            cert: self.getIdpCert(),
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
                Logger.log("info", "User is already authenticated!!");
                res.send('Authenticated');
            }
        );

        app.get("/Shibboleth/login",
            passport.authenticate("saml", { failureRedirect: "/Shibboleth/login/fail" }),
            function (req, res) {
                res.redirect("/");
            }
        );

        app.post("/Shibboleth/login/callback",
            passport.authenticate("saml", { failureRedirect: "/Shibboleth/login/fail" }),
            function(req, res) {
                Logger.log("info", "will check req.user!!");
                self.auth(req, res);
            }
        );

        app.get("/Shibboleth/login/fail",
            function(req, res) {
                Logger.log("Login failed!");
                res.status(401).send("Login failed");
            }
        );

        app.get("/Shibboleth.sso/Metadata",
            function(req, res) {
                res.type("application/xml");
                res.status(200).send(samlStrategy.generateServiceProviderMetadata(self.getCert()));
            }
        );
    }

    loginUser(user, req, res)
    {
        req.logIn(user, function (err)
        {
            if (isNull(err))
            {
                req.session.isAdmin = false;
                req.session.upload_manager = new UploadManager(user.ddr.username);

                req.flash("success", "Welcome, " + user.foaf.firstName + " " + user.foaf.surname + ".");

                if (Config.debug.permissions.log_authorizations)
                {
                    Logger.log("User " + user.ddr.username + " signed in.");
                }

                if (req.body.redirect)
                {
                    res.redirect(req.body.redirect);
                }
                else
                {
                    res.redirect("/projects/my");
                }
            }
            else
            {
                req.flash("success", "There was an error signing you in.");
                Logger.log("Error signing in user " + JSON.stringify(err));
                throw err;
            }
        });
    }

    auth(req, res)
    {
        const self = this;
        const auth = require(Pathfinder.absPathInSrcFolder("/controllers/auth"));
        self.getMatchingUserInDendro(req.user, function (err, newUser) {
            if(!isNull(err))
            {
                const errorMessage = "Error signing in user " + newUser;
                Logger.log("error", errorMessage);
                auth.failLogin(req, res, errorMessage);
            }
            else if(isNull(newUser))
            {
                const errorMessage = "Error signing in user " + "newUser is null";
                Logger.log("error", errorMessage);
                auth.failLogin(req, res, errorMessage);
            }
            else
            {
                self.loginUser(newUser, req, res);
            }
        });
    }

    getMatchingUserInDendro(shibbolethUser, callback)
    {

        const updateExistingUser = function (dendroUser, shibbolethUser, callback) {

            let mboxKey = self.getMBoxKey();
            let firstNameKey = self.getFirstNameKey();
            let surnameKey = self.getSurnameKey();
            let usernameKey = self.getUsernameKey();

            let mbox = shibbolethUser[mboxKey];
            let firstName = shibbolethUser[firstNameKey];
            let surname = shibbolethUser[surnameKey];
            let username = shibbolethUser[usernameKey];

            dendroUser.foaf.mbox = mbox;
            dendroUser.foaf.firstName = firstName;
            dendroUser.foaf.surname = surname;
            dendroUser.ddr.username = username;

            dendroUser.save(function (err, editedUser)
            {
                callback(err, editedUser);
            });
        };

        const validUserKeysAndValues = function (firstNameKey, surnameKey, usernameKey, shibbolethUser)
        {
            let isValid = false;
            if(!isNull(firstNameKey) && !isNull(surnameKey) && !isNull(usernameKey) && !isNull(shibbolethUser))
            {
                let firstName = shibbolethUser[firstNameKey];
                let surname = shibbolethUser[surnameKey];
                let username = shibbolethUser[usernameKey];
                if(!isNull(firstName) && !isNull(surname) && !isNull(username))
                {
                    isValid = true;
                }
            }
            return isValid;
        };

        const userHasEmail = function (mboxKey) {
            let result = false;
            if(!isNull(mboxKey) && !isNull(shibbolethUser))
            {
                let mbox = shibbolethUser[mboxKey];
                if(!isNull(mbox))
                {
                    result = true;
                }
            }
            return result;
        };

        let self = this;
        if(!isNull(shibbolethUser))
        {
            let mboxKey = self.getMBoxKey();
            let firstNameKey = self.getFirstNameKey();
            let surnameKey = self.getSurnameKey();
            let usernameKey = self.getUsernameKey();

            if(validUserKeysAndValues(firstNameKey, surnameKey, usernameKey, shibbolethUser) === false)
            {
                const errorMessage = "There seems to be a problem with the Identity provider institution, please contact the System Administrator!";
                const err = new Error(errorMessage);
                Logger.log("error", "The service provider is not sending the proper user information in the login callback handler!");
                return callback(true, err)
            }
            else if(userHasEmail(mboxKey) === false)
            {
                const errorMessage = "You have no registered email. Contact the helpdesk to register your institutional email in the system!";
                const err = new Error(errorMessage);
                Logger.log("error", errorMessage);
                return callback(true, err)
            }
            else
            {
                //everything is ok, proceed with login
                let mbox = shibbolethUser[mboxKey];
                let firstName = shibbolethUser[firstNameKey];
                let surname = shibbolethUser[surnameKey];
                let username = shibbolethUser[usernameKey];
                User.findByUsername(username, function (err, user) {
                    if(isNull(err))
                    {
                        if(isNull(user))
                        {
                            let password = self.constructor.name + "__" + new Date().getTime();
                            let isShibbolethUser = true;
                            User.createAndInsertFromObject({
                                    foaf: {
                                        mbox: mbox,
                                        firstName: firstName,
                                        surname: surname
                                    },
                                    ddr: {
                                        username: username,
                                        password: password,
                                        isShibbolethUser: isShibbolethUser
                                    }
                                },
                                function (err, newUser)
                                {
                                    if(!isNull(err))
                                    {
                                        const errorMessage = "Error when creating a new user for the first time in Dendro from a Shibboleth source, error: " + JSON.stringify(err);
                                        Logger.log("error", errorMessage);
                                        return callback(true, err);
                                    }
                                    else if(isNull(newUser))
                                    {
                                        const errorMessage = "Error when creating a new user for the first time in Dendro from a Shibboleth source, error: " + "newUser is null";
                                        Logger.log("error", errorMessage);
                                        const err = new Error(errorMessage);
                                        return callback(true, err);
                                    }
                                    else
                                    {
                                        return callback(err, newUser);
                                    }
                                });
                        }
                        else
                        {
                            //update user here with new values from the user Keys
                            Logger.log("info", "Will update existing user at login time");
                            updateExistingUser(user, shibbolethUser, function (err, user) {
                                return callback(err, user);
                            });
                        }
                    }
                    else
                    {
                        Logger.log("error", "Error at getMatchingUserInDendro: " + JSON.stringify(err));
                        return callback(true, err)
                    }
                });
            }
        }
        else
        {
            const errorMessage = "Shibboleth user object is missing!";
            const error = new Error(errorMessage);
            Logger.log("error", errorMessage);
            return  callback(true, error);
        }
    }
}

module.exports.Shibboleth = Shibboleth;
