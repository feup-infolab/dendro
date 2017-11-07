const path = require('path');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;
const Elements = require(Pathfinder.absPathInSrcFolder('/models/meta/elements.js')).Elements;

const isNull = require(Pathfinder.absPathInSrcFolder('/utils/null.js')).isNull;
const User = require(Pathfinder.absPathInSrcFolder('/models/user.js')).User;

module.exports.login = function (req, res, next)
{
    req.passport.authenticate('orcid', function (err, user, info)
    {
        if (err)
        {
            return res.status(500).redirect('/login');
        }
        if (!user && info instanceof Object)
        {
            let rp = require('request-promise');
            let options = {
                method: 'GET',
                uri: 'https://pub.orcid.org/v2.1/' + info.orcid_data.params.orcid + '/personal-details',
                json: true
            };

            rp(options)
                .then(function (personal_details)
                {
                    res.render(
                        'auth/register',
                        {
                            new_user: {
                                firstname: personal_details.name['given-names'].value,
                                surname: personal_details.name['family-name'].value,
                                orcid: info.orcid_data.params.orcid
                            },
                            data_provider: 'orcid',
                            csrfToken: req.csrfToken(),
                            info_messages: ['Some information was already filled from your ORCID profile.']
                        }
                    );
                })
                .catch(function (err)
                {
                    const util = require('util');
                    const error = 'ORCID server returned error: \n ' + util.inspect(err);
                    console.trace(err);
                    console.error(error);
                    res.render(
                        '/login',
                        {
                            error_messages: ['There was an error communicating with the ORCID system. Please register/login using the standard method.']
                        }
                    );
                });
        }
        else
        {
            req.logIn(user, function (err)
            {
                if (err)
                {
                    return next(err);
                }
                return res.redirect('/projects/my');
            });
        }
    })(req, res, next);
};
