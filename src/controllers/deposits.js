
// follows the DC Terms ontology :
// @see http://bloody-byte.net/rdf/dc_owl2dl/dc.ttl
// creator is an URI to the author : http://dendro.fe.up.pt/user/<username>

const async = require("async");
const moment = require("moment");
const dateFormat = require("dateformat");
const rlequire = require("rlequire");
const path = require("path");
const _ = require("underscore");

const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const InformationElement = rlequire("dendro", "src/models/directory_structure/information_element.js").InformationElement;
const Deposit = rlequire("dendro", "src//models/deposit.js").Deposit;
const Descriptor = rlequire("dendro", "src/models/meta/descriptor.js").Descriptor
const Ontology = rlequire("dendro", "src/models/meta/ontology.js").Ontology;
const Permissions = rlequire("dendro", "src/models/meta/permissions.js").Permissions;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;

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

exports.show = function (req, res){
  const userIsLoggedIn = Boolean(req.user);
  let resourceURI = req.params.requestedResourceUri;

  function sendResponse (viewVars, requestedResource)
  {
    const askedForHtml = function (req, res)
    {
      const accept = req.header("Accept");
      let serializer = null;
      let contentType = null;
      if (accept in Config.metadataSerializers)
      {
        serializer = Config.metadataSerializers[accept];
        contentType = Config.metadataContentTypes[accept];

        if (!isNull(req.query.deep))
        {
          requestedResource.findMetadataRecursive(function (err, result)
          {
            if (isNull(err))
            {
              result.is_project_root = false;
              res.set("Content-Type", contentType);
              res.send(serializer(result));
            }
            else
            {
              res.status(500).json({
                error_messages: "Error finding metadata from " + requestedResource.uri + "\n" + result
              });
            }
          }, [Elements.access_types.locked, Elements.access_types.locked_for_projects, Elements.access_types.private]);
        }
        else
        {
          requestedResource.findMetadata(function (err, result)
          {
            if (isNull(err))
            {
              result.is_project_root = true;
              res.set("Content-Type", contentType);
              res.send(serializer(result));
            }
            else
            {
              res.status(500).json({
                error_messages: "Error finding metadata from " + requestedResource.uri + "\n" + result
              });
            }
          }, [Elements.access_types.locked, Elements.access_types.locked_for_projects, Elements.access_types.private]);
        }

        return false;
      }
      return true;
    };

    const _ = require("underscore");

    const isEditor = _.filter(req.permissions_management.reasons_for_authorizing, function (authorization)
    {
      const reason = authorization.role;

      return _.isEqual(reason, Permissions.settings.role.in_owner_project.creator) || _.isEqual(reason, Permissions.settings.role.in_owner_project.contributor) || _.isEqual(reason, Permissions.settings.role.in_system.admin);
    });

    if (isEditor.length > 0 || req.session.isAdmin)
    {
      if (askedForHtml(req, res))
      {
        res.render("projects/show",
          viewVars
        );
      }
    }
    else
    {
      const isPublicDeposit = _.filter(req.permissions_management.reasons_for_authorizing, function (authorization)
      {
        const reason = authorization.role;
        return _.isEqual(reason, Permissions.settings.privacy.of_deposit.public) || _.isEqual(reason, Permissions.settings.privacy.of_owner_project.metadata_only);
      });

      const isPrivateDeposit = _.filter(req.permissions_management.reasons_for_authorizing, function (authorization)
      {
        const reason = authorization.role;
        return _.isEqual(reason, Permissions.settings.role.users_role_in_deposit);
      });

      if (isPublicDeposit.length > 0)
      {
        if (askedForHtml(req, res))
        {
          res.render("projects/show_readonly",
            viewVars
          );
        }
      }
      else if (isPrivateDeposit.length > 0)
      {
        if (askedForHtml(req, res))
        {
          res.render("projects/show_readonly",
            viewVars
          );
        }
      }
      /*else if (isMetadataOnlyProject.length > 0)
      {
        if (askedForHtml(req, res))
        {
          res.render("projects/show_metadata",
            viewVars
          );
        }
      }*/
      else
      {
        if (askedForHtml(req, res))
        {
          req.flash("error", "There was an role calculation error accessing resource at " + requestedResource.uri);
          res.redirect("/projects/my");
        }
      }
    }
  }

  let showing_history = Boolean(req.query.show_history);

  const fetchVersionsInformation = function (archivedResource, cb)
  {
    archivedResource.getDetailedInformation(function (err, result)
    {
      cb(err, result);
    });
  };

  const viewVars = {
    showing_history: showing_history,
    Descriptor: Descriptor
  };

  InformationElement.findByUri(resourceURI, function (err, resourceBeingAccessed)
  {
    if (isNull(err) && !isNull(resourceBeingAccessed) && resourceBeingAccessed instanceof InformationElement)
    {
      const getBreadCrumbs = function (callback)
      {
        const getParentDeposit = function (callback)
        {
          resourceBeingAccessed.getOwnerDeposit(function (err, project)
          {
            return callback(err, project);
          });
        };
        const getParentFolders = function (callback)
        {
          resourceBeingAccessed.getAllParentsUntilProject(function (err, parents)
          {
            return callback(err, parents);
          });
        };

        async.series(
          [
            getParentFolders,
            getParentDeposit
          ],
          function (err, results)
          {
            if (isNull(err))
            {
              const parents = results[0];
              const ownerDeposit = results[1];
              const immediateParent = parents[parents.length - 1];

              const breadcrumbs = [];

                breadcrumbs.push(
                  {
                    uri: "/",
                    title: "Home",
                    icons: [
                      "/images/icons/folders.png",
                      "/images/icons/bullet_world.png"
                    ]
                  }
                );
              

              if (!isNull(immediateParent))
              {
                if (immediateParent.uri === ownerDeposit.ddr.rootFolder)
                {
                  go_up_options = {
                    uri: ownerDeposit.uri,
                    title: ownerDeposit.dcterms.title,
                    icons: [
                      "/images/icons/box_closed.png",
                      "/images/icons/bullet_up.png"
                    ]
                  };
                }
                else
                {
                  go_up_options = {
                    uri: immediateParent.uri,
                    title: immediateParent.nie.title,
                    icons: [
                      "/images/icons/folder.png",
                      "/images/icons/bullet_up.png"
                    ]
                  };
                }
              }
              else
              {
                go_up_options = {
                  uri: ownerDeposit.uri,
                  title: ownerDeposit.dcterms.title,
                  icons: [
                    "/images/icons/box_closed.png",
                    "/images/icons/bullet_up.png"
                  ]
                };
              }

              breadcrumbs.push({
                uri: ownerDeposit.uri,
                title: ownerDeposit.dcterms.title,
                icons: [
                  "/images/icons/box_closed.png",
                  "/images/icons/bullet_up.png"
                ]
              });

              for (let i = 0; i < parents.length; i++)
              {
                breadcrumbs.push(
                  {
                    uri: parents[i].uri,
                    type: parents[i].rdf.type,
                    title: parents[i].nie.title,
                    icons: [
                      "/images/icons/folder.png"
                    ]
                  }
                );
              }

              breadcrumbs.push(
                {
                  uri: resourceBeingAccessed.uri,
                  type: resourceBeingAccessed.rdf.type,
                  title: resourceBeingAccessed.nie.title,
                  icons: [
                    resourceBeingAccessed.uri + "?thumbnail&size=small"
                  ]
                }
              );

              return callback(null,
                {
                  breadcrumbs: breadcrumbs,
                  go_up_options: go_up_options
                }
              );
            }
            return callback(err, results);
          });
      };

      const getResourceMetadata = function (breadcrumbs, callback)
      {
        viewVars.breadcrumbs = breadcrumbs.breadcrumbs;
        viewVars.go_up_options = breadcrumbs.go_up_options;

        resourceBeingAccessed.getOwnerDeposit(function (err, project)
        {
          if (isNull(err) && !isNull(project))
          {
            viewVars.project = project;
            viewVars.title = project.dcterms.title;
            viewVars.subtitle = "(Project handle : " + project.ddr.handle + ")";

            if (showing_history)
            {
              resourceBeingAccessed.getArchivedVersions(null, null, function (err, archivedResources)
              {
                if (isNull(err))
                {
                  async.mapSeries(archivedResources, fetchVersionsInformation, function (err, fullVersions)
                  {
                    if (isNull(err))
                    {
                      viewVars.versions = fullVersions;
                      sendResponse(viewVars, resourceBeingAccessed);
                      return callback(null);
                    }
                    return callback(err, "Unable to fetch descriptors. Reported Error: " + fullVersions);
                  });
                }
                else
                {
                  return callback(err, "Unable to fetch project revisions. Reported Error: " + archivedResources);
                }
              });
            }
            else
            {
              const descriptors = resourceBeingAccessed.getPropertiesFromOntologies(
                Ontology.getPublicOntologiesUris()
              );

              viewVars.descriptors = descriptors;
              sendResponse(viewVars, resourceBeingAccessed);
            }
          }
          else
          {
            return callback(err, "Unable to fetch contents of folder " + JSON.stringify(resourceBeingAccessed));
          }
        });
      };

      async.waterfall([
        getBreadCrumbs,
        getResourceMetadata
      ], function (err, results)
      {
        if (!isNull(err))
        {
          const flash = require("connect-flash");
          flash("error", results);
          res.redirect("back");
        }
      });
    }
    else
    {
      const flash = require("connect-flash");
      flash("error", "Resource with uri " + resourceURI + " does not exist.");
      if (!res._headerSent)
      {
        res.redirect("back");
      }
    }
  });
}