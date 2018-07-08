
// follows the DC Terms ontology :
// @see http://bloody-byte.net/rdf/dc_owl2dl/dc.ttl
// creator is an URI to the author : http://dendro.fe.up.pt/user/<username>

const async = require("async");
const moment = require("moment");
const dateFormat = require("dateformat");
const rlequire = require("rlequire");

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Deposit = rlequire("dendro", "src//models/deposit.js").Deposit;

exports.getDeposits = function (req, res)
{
    const user = req.user;
    const acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");
    let display;

    const verification = function (err, results)
    {
        if (isNull(err))
        {
            if (display === "json")
            {
                res.json({deposits: results[0], repositories: results[1]});
            }
            else
            {
                res.render("", {deposits: results[0], repositories: results[1]});
            }
        }
    };

    if (acceptsJSON && !acceptsHTML)
    {
        display = "json";
    }
    else if (!acceptsJSON && acceptsHTML)
    {
        display = "render";
    }

    exports.allowed(req, verification);
};

exports.allowed = function (req, callback)
{
    let params = req.query;
    if (req.user)
    {
        params.self = req.user.uri;
    }
    if (!isNull(params.dateFrom))
    {
        params.dateFrom = dateFormat(params.dateFrom, "isoDateTime");
    }
    if (!isNull(params.dateTo))
    {
        let nextDay = new Date(params.dateTo);
        nextDay.setDate(nextDay.getDate() + 1);
        params.dateTo = dateFormat(nextDay, "isoDateTime");
    }

    let platforms = [];
    for (platform in params.platforms)
    {
        const p = JSON.parse(params.platforms[platform]);
        if (p.value)
        {
            platforms.push(p.name);
        }
    }
    if (platforms.length !== 0)
    {
        params.platforms = platforms;
    }
    else
    {
        params.platforms = null;
    }

    let repositories = [];
    if (!isNull(params.repositories))
    {
        if (params.repositories instanceof Array)
        {
            for (repo in params.repositories)
            {
                const p = JSON.parse(params.repositories[repo]);
                if (p.value)
                {
                    repositories.push(p.name);
                }
            }
        }
        else
        {
            const p = JSON.parse(params.repositories);
            if (p.value)
            {
                repositories.push(p.name);
            }
        }
    }
    if (repositories.length !== 0)
    {
        params.repositories = repositories;
    }
    else
    {
        params.repositories = null;
    }

    switch (params.order)
    {
    case "Username":
        params.order = "user";
        break;
    case "Project":
        params.order = "projectTitle";
        break;
    case "Date":
    default:
        params.order = "date";
        break;
    }

    async.series([
        function (callback)
        {
            Deposit.createQuery(params, callback);
        },
        function (callback)
        {
            if (!isNull(params.new_listing) && params.new_listing === "true")
            {
                Deposit.getAllRepositories(params, callback);
            }
            else
            {
                callback(null);
            }
        }
    ], function (err, results)
    {
        callback(err, results);
    });

    /* Deposit.createQuery(params, function(err, results){
        Deposit.getAllRepositories(function(err, repos){
          callback(err, results);
        })
    });*/
};

exports.getDeposit = function (req, res)
{
    const appendPlatformUrl = function ({ ddr: {exportedToPlatform: platform, exportedToRepository: url}})
    {
        const https = "https://";
        switch (platform)
        {
        case "EUDAT B2Share":
            return https + url + "/records/";
            break;
        case "CKAN":
            return https + url + "/dataset/";
            break;
        case "Figshare":
            break;
        case "Zenodo":
            break;
        case "EPrints":
            break;
        default:
            return url;
        }
    };

    const acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");
    let display;
    if (acceptsJSON && !acceptsHTML)
    {
        display = "json";
    }
    else if (!acceptsJSON && acceptsHTML)
    {
        display = "render";
    }

    let resourceURI = req.params.requestedResourceUri;
    Deposit.findByUri(resourceURI, function (err, deposit)
    {
        if (isNull(err))
        {
            const viewVars = {
                title: "Deposit information"
            };

            // not ready yet
            Deposit.validatePlatformUri(deposit, function (deposit)
            {
                deposit.dcterms.date = moment(deposit.dcterms.date).format("LLLL");
                deposit.externalUri = appendPlatformUrl(deposit) + deposit.dcterms.identifier;
                if (display === "json")
                {
                    res.json(deposit);
                }
                else
                {
                    viewVars.deposit = deposit;
                    res.render("registry/deposit", viewVars);
                }
            });
        }
    });
};
