const Pathfinder = global.Pathfinder;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

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
    if(jsonOnly)
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

exports.acceptDescriptorFromQuickListWhileItWasAProjectFavorite = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/accept_descriptor_from_quick_list_while_it_was_a_project_favorite";
    if(jsonOnly)
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

exports.acceptDescriptorFromQuickListWhileItWasAUserFavorite = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/accept_descriptor_from_quick_list_while_it_was_a_user_favorite";
    if(jsonOnly)
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

exports.acceptDescriptorFromQuickListWhileItWasAUserAndProjectFavorite = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/accept_descriptor_from_quick_list_while_it_was_a_user_and_project_favorite";
    if(jsonOnly)
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

exports.acceptDescriptorFromManualList = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/accept_descriptor_from_manual_list";
    if(jsonOnly)
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

exports.acceptDescriptorFromManualListWhileItWasAProjectFavorite = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/accept_descriptor_from_manual_list_while_it_was_a_project_favorite";
    if(jsonOnly)
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

exports.acceptDescriptorFromManualListWhileItWasAUserFavorite = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_favorite";
    if(jsonOnly)
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

exports.acceptDescriptorFromManualListWhileItWasAUserAndProjectFavorite = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/accept_descriptor_from_manual_list_while_it_was_a_user_and_project_favorite";
    if(jsonOnly)
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

exports.hideDescriptorFromQuickListForProject = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/hide_descriptor_from_quick_list_for_project";
    if(jsonOnly)
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

exports.unhideDescriptorFromQuickListForProject = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/unhide_descriptor_from_quick_list_for_project";
    if(jsonOnly)
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

exports.hideDescriptorFromQuickListForUser = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/hide_descriptor_from_quick_list_for_user";
    if(jsonOnly)
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

exports.unhideDescriptorFromQuickListForUser = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/unhide_descriptor_from_quick_list_for_user";
    if(jsonOnly)
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

exports.favoriteDescriptorFromQuickListForProject = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/favorite_descriptor_from_quick_list_for_project";
    if(jsonOnly)
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

exports.favoriteDescriptorFromQuickListForUser = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/favorite_descriptor_from_quick_list_for_user";
    if(jsonOnly)
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

exports.unfavoriteDescriptorFromQuickListForUser = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/unfavorite_descriptor_from_quick_list_for_user";
    if(jsonOnly)
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

exports.unfavoriteDescriptorFromQuickListForProject = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/unfavorite_descriptor_from_quick_list_for_project";
    if(jsonOnly)
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

exports.acceptDescriptorFromAutocomplete = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/accept_descriptor_from_autocomplete";
    if(jsonOnly)
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

exports.rejectOntologyFromQuickList = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/reject_ontology_from_quick_list";
    if(jsonOnly)
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

exports.selectOntologyManually = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/select_ontology_manually";
    if(jsonOnly)
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

exports.selectDescriptorFromManualList = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/select_descriptor_from_manual_list";
    if(jsonOnly)
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

exports.acceptSmartDescriptorInMetadataEditor = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/accept_smart_descriptor_in_metadata_editor";
    if(jsonOnly)
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

exports.acceptFavoriteDescriptorInMetadataEditor = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/accept_favorite_descriptor_in_metadata_editor";
    if(jsonOnly)
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

exports.deleteDescriptorInMetadataEditor = function (jsonOnly, agent, bodyObj, cb) {
    const path = "/interactions/delete_descriptor_in_metadata_editor";
    if(jsonOnly)
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

exports.getLatestInteractionInDB = function (callback)
{
    Config.mysql.default.pool.getConnection(function (err, connection)
    {
        if (isNull(err))
        {
            const countInteractionsQuery = "SELECT * FROM interactions ORDER BY ID DESC LIMIT 1" + ";\n";
            connection.query(
                countInteractionsQuery,
                function (err, result, fields)
                {
                    connection.release();
                    if (isNull(err))
                    {
                        callback(err, result);
                    }
                    else
                    {
                        return callback(true, "[ERROR] Unable get the latest interaction info on the MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
                    }

                }
            );
        }
        else
        {
            return callback(true, "[ERROR] Unable to connect to MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
        }
    });
};

exports.getNumberOfInteractionsInDB = function (callback)
{
    Config.mysql.default.pool.getConnection(function (err, connection)
    {
        if (isNull(err))
        {
            const countInteractionsQuery = "SELECT count(*) as nInteractions FROM interactions" + ";\n";
            connection.query(
                countInteractionsQuery,
                function (err, result, fields)
                {
                    connection.release();
                    if (isNull(err))
                    {
                        callback(err, result);
                    }
                    else
                    {
                        return callback(true, "[ERROR] Unable to count the number of interations on the MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
                    }

                }
            );
        }
        else
        {
            return callback(true, "[ERROR] Unable to connect to MySQL Database server running on " + Config.mySQLHost + ":" + Config.mySQLPort + "\n Error description : " + err);
        }
    });
};