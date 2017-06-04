const Config = function() { return GLOBAL.Config; }();

const User = require(Config.absPathInSrcFolder("/models/user.js")).User;

module.exports.login = function(req, res, next){
        req.passport.authenticate('orcid', function(err, user, info) {
            if (err) { return res.redirect('/login'); }
            if( !user && info instanceof Object)
            {
                let rp = require('request-promise');
                let options =  {
                    method: 'GET',
                    uri: "https://pub.orcid.org/v2.1/"+ info.orcid_data.params.orcid + "/personal-details",
                    json: true
                };

                rp(options)
                    .then(function (personal_details) {
                        res.render(
                            "auth/register",
                            {
                                new_user : {
                                    firstname : personal_details.name["given-names"].value,
                                    surname : personal_details.name["family-name"].value,
                                    orcid : info.orcid_data.params.orcid
                                },
                                data_provider : "orcid",
                                "info_messages" : ["Some information was already filled from your ORCID profile."]
                            }
                        )
                    })
                    .catch(function(err){
                        const util = require('util');
                        const error = "ORCID server returned error: \n " + util.inspect(err);
                        console.trace(err);
                        console.error(error);
                        res.render(
                            "/login",
                            {
                                "error_messages" : ["There was an error communicating with the ORCID system. Please register/login using the standard method."]
                            }
                        )
                    });
            }
        })(req, res, next);

    /*req.passport.authenticate('orcid', module.exports.register);

        // NOTE: `profile` is empty, use `params` instead
    User.findByORCID(params.orcid, function (err, user) {
        return done(err, user);
    });*/
};

module.exports.register = function(err, user, data, done){
    if(!err)
    {
        if(req.originalMethod == "GET")
        {
            return res.render('auth/register',
                {
                    title : "Register on Dendro"
                }
            );
        }
    }
    else
    {
        if(req.originalMethod == "GET")
        {
            return res.render('/',
                {
                    title : "Register on Dendro",
                    error_messages : ["There was an error communicating with ORCID."]
                }
            );
        }
    }
};
