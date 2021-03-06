const rlequire = require("rlequire");
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src//utils/null.js").isNull;
const dbMySQL = rlequire("dendro", "src/mysql_models");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

exports.recordInteraction = function (jsonOnly, folderUri, projectHandle, interactionData, agent, cb)
{
    const path = folderUri + "?register_interaction";

    if (jsonOnly)
    {
        agent
            .post(path)
            .send(interactionData)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(interactionData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.acceptDescriptorFromQuickList = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/accept_descriptor_from_quick_list";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.acceptDescriptorFromQuickListWhileItWasAProjectFavorite = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/accept_descriptor_from_quick_list_while_it_was_a_project_favorite";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.acceptDescriptorFromQuickListWhileItWasAUserFavorite = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/accept_descriptor_from_quick_list_while_it_was_a_user_favorite";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.acceptDescriptorFromQuickListWhileItWasAUserAndProjectFavorite = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.acceptDescriptorFromManualList = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/accept_descriptor_from_manual_list";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.acceptDescriptorFromManualListWhileItWasAProjectFavorite = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/accept_descriptor_from_manual_list_while_it_was_a_project_favorite";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.acceptDescriptorFromManualListWhileItWasAUserFavorite = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_favorite";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.acceptDescriptorFromManualListWhileItWasAUserAndProjectFavorite = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.hideDescriptorFromQuickListForProject = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/hide_descriptor_from_quick_list_for_project";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.unhideDescriptorFromQuickListForProject = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/unhide_descriptor_from_quick_list_for_project";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.hideDescriptorFromQuickListForUser = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/hide_descriptor_from_quick_list_for_user";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.unhideDescriptorFromQuickListForUser = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/unhide_descriptor_from_quick_list_for_user";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.favoriteDescriptorFromQuickListForProject = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/favorite_descriptor_from_quick_list_for_project";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.favoriteDescriptorFromQuickListForUser = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/favorite_descriptor_from_quick_list_for_user";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.favoriteDescriptorFromManualListForProject = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/favorite_descriptor_from_manual_list_for_project";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.favoriteDescriptorFromManualListForUser = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/favorite_descriptor_from_manual_list_for_user";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.unfavoriteDescriptorFromQuickListForUser = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/unfavorite_descriptor_from_quick_list_for_user";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.unfavoriteDescriptorFromQuickListForProject = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/unfavorite_descriptor_from_quick_list_for_project";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.acceptDescriptorFromAutocomplete = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/accept_descriptor_from_autocomplete";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.rejectOntologyFromQuickList = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/reject_ontology_from_quick_list";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.selectOntologyManually = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/select_ontology_manually";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.selectDescriptorFromManualList = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/select_descriptor_from_manual_list";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.acceptSmartDescriptorInMetadataEditor = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/accept_smart_descriptor_in_metadata_editor";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.acceptFavoriteDescriptorInMetadataEditor = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/accept_favorite_descriptor_in_metadata_editor";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.deleteDescriptorInMetadataEditor = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/delete_descriptor_in_metadata_editor";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.fillInDescriptorFromManualListInMetadataEditor = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/fill_in_descriptor_from_manual_list_in_metadata_editor";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.fillInDescriptorFromManualListWhileItWasAProjectFavorite = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_project_favorite";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.fillInDescriptorFromManualListWhileItWasAUserFavorite = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_user_favorite";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.fillInDescriptorFromManualListWhileItWasAUserAndProjectFavorite = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/fill_in_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.fillInDescriptorFromQuickListInMetadataEditor = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/fill_in_descriptor_from_quick_list_in_metadata_editor";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.fillInDescriptorFromQuickListWhileItWasAProjectFavorite = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_project_favorite";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.fillInDescriptorFromQuickListWhileItWasAUserFavorite = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_user_favorite";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.fillInDescriptorFromQuickListWhileItWasAUserAndProjectFavorite = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/fill_in_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.fillInInheritedDescriptor = function (jsonOnly, agent, bodyObj, cb)
{
    const path = "/interactions/fill_in_inherited_descriptor";
    if (jsonOnly)
    {
        agent
            .post(path)
            .send(bodyObj)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(bodyObj)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.deleteAll = function (jsonOnly, agent, cb)
{
    const path = "/interactions/delete_all";
    if (jsonOnly)
    {
        agent
            .delete(path)
            .set("Accept", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .delete(path)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

exports.getLatestInteractionInDB = function (callback)
{
    const latestInteractionQuery = "SELECT * FROM interactions ORDER BY ID DESC LIMIT 1" + ";\n";
    dbMySQL.sequelize
        .query(latestInteractionQuery, { type: dbMySQL.sequelize.QueryTypes.SELECT})
        .then(result =>
        {
            if (isNull(result))
            {
                return callback(null, []);
            }

            return callback(null, result);
        })
        .catch(err =>
            callback(true, "[ERROR] Unable get the latest interaction info on the MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + JSON.stringify(err)));
};

exports.getNumberOfInteractionsInDB = function (callback)
{
    const countInteractionsQuery = "SELECT count(*) as nInteractions FROM interactions" + ";\n";
    dbMySQL.sequelize
        .query(countInteractionsQuery, { type: dbMySQL.sequelize.QueryTypes.SELECT})
        .then(result =>
        {
            if (isNull(result))
            {
                return callback(null, []);
            }

            return callback(null, result);
        })
        .catch(err =>
            callback(true, "[ERROR] Unable to count the number of interations on the MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "and dbName: " + Config.mySQLDBName + "\n Error description : " + err));
};
