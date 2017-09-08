const async = require("async");
const needle = require('needle');
const _ = require("underscore");


const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const Interaction = require(Pathfinder.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;
const File = require(Pathfinder.absPathInSrcFolder("/models/directory_structure/file.js")).File;
const Folder= require(Pathfinder.absPathInSrcFolder("/models/directory_structure/folder.js")).Folder;
const User = require(Pathfinder.absPathInSrcFolder("/models/user.js")).User;

const DendroRecommender = require("../../dendro_recommender.js").DendroRecommender;
const DRConnection = require("../connection.js").DRConnection;
const InteractionMapper = require("../mappers/interaction_mapper.js").InteractionMapper;

exports.generate_random_interactions = function(req, res)
{
    if(!isNull(req.body.how_many))
    {
        const howMany = req.body.how_many;
        const howManyLoops = Math.ceil(howMany / Config.recommendation.random_interactions_generation_page_size);

        const selectNRandomDescriptors = function(howMany, callback)
        {
            let randomDescriptors = [];

            Descriptor.getRandomDescriptors(req.body.included_ontologies,
                howMany,
                function(err, randomDescriptorsPage){
                    if(isNull(err) && randomDescriptorsPage.length > 0)
                    {
                        randomDescriptors = randomDescriptors.concat(randomDescriptorsPage);
                        callback(null, randomDescriptors);
                    }
                    else
                    {
                        callback(err, randomDescriptors);
                    }
                });
        };

        const selectNRandomResources = function(howMany, callback)
        {
            async.timesSeries(howMany, function(n, callback){
                var file = Math.round(Math.random());

                if(file)
                {
                    File.randomInstance(File.prefixedRDFType, function(err, file){
                        callback(err, file);
                    });
                }
                else
                {
                    Folder.randomInstance(Folder.prefixedRDFType, function(err, folder){
                        callback(err, folder);
                    });
                }
            },
            function(err, randomFilesOrFolders){
                callback(err, randomFilesOrFolders);
            });
        };

        const selectNRandomNonUniqueUsers = function(howMany, callback)
        {
            async.timesSeries(howMany, function(n, callback){
                User.randomInstance("ddr:User", function(err, user){
                    callback(err, user);
                });
            },
            function(err, users){
                callback(err, users);
            });
        };

        const generateNRandomInteractions = function(howManyToGenerate, user, callback)
        {
            async.waterfall([
                    function(callback)
                    {
                        selectNRandomDescriptors(howManyToGenerate, function(err, descriptors)
                        {
                            callback(err, descriptors);
                        });
                    },
                    function(descriptors, callback)
                    {
                        selectNRandomResources(howManyToGenerate, function(err, resources)
                        {
                            callback(err, descriptors, resources);
                        });
                    },
                    function(descriptors, resources, callback)
                    {
                        if(!isNull(user))
                        {
                            const users = [];
                            for (let i = 0; i < howManyToGenerate; i++)
                            {
                                users.push(user);
                            }

                            callback(null, descriptors, resources, users);
                        }
                        else
                        {
                            selectNRandomNonUniqueUsers(howManyToGenerate, function(err, users)
                            {
                                callback(err, descriptors, resources, users);
                            });
                        }
                    },
                    function(descriptors, resources, users, cb)
                    {
                        async.timesSeries(howManyToGenerate, function(n, cb){
                                const interactionType = Interaction.getRandomType(req.body);
                                const descriptor = descriptors[n];
                                const resource = resources[n];
                                const user = users[n];

                            if(!isNull(descriptor) && isNull(interactionType) && isNull(user) && isNull(resource))
                            {
                                Interaction.create({
                                    ddr : {
                                        performedBy : user.uri,
                                        interactionType : interactionType.key,
                                        executedOver : descriptor.uri,
                                        originallyRecommendedFor : resource.uri
                                    }
                                }, function(err, randomInteraction){
                                    if(err)
                                    {
                                        console.error("Error generating random interaction " + n + " : " + randomInteraction);
                                    }

                                    cb(err, randomInteraction);
                                });
                            }
                            else
                            {
                                console.log("Not enough random descriptors/resources/users/types to generate " + howManyToGenerate + " interactions!!!");
                                cb(1, null);
                            }
                        },
                        function(err, interactions)
                        {
                            cb(err, interactions);
                        });
                    }
                ],
                function(err, interactions)
                {
                    callback(err, interactions);
                });
        };

        const createSpecificUserArray = function(user, callback)
        {
            const valid_url = function (url)
            {
                const regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
                return regexp.test(url);
            };

            if (!isNull(user) && valid_url(user))
            {
                User.findByUri(user, function (err, user)
                {
                    if (err)
                    {
                        console.error("Unable to fetch user with uri " + user);
                    }

                    callback(err, user);
                });
            }
            else
            {
                callback(null, null);
            }
        };

        const saveInteractions = function(interactionsArray, callback)
        {
            async.map(
                interactionsArray,
                function(interaction, cb){
                    interaction.save(function(err, interaction){
                        if(isNull(err))
                        {
                            //console.log("Interaction " + interaction.uri + " saved successfully.");
                        }
                        else
                        {
                            console.error("Error saving interaction " + interaction.uri + " .");
                        }

                        cb(err, interaction);
                    });
                },
                function(err, results){
                    callback(err, results);
                });
        };

        const generateInteractionsInLoop = function(howMany, howManyLoops, user, callback)
        {
            async.timesSeries(howManyLoops,
                function(n, callback)
                {
                    let howManyInLoop;

                    if (n < howManyLoops - 1)
                    {
                        howManyInLoop = Config.recommendation.random_interactions_generation_page_size;
                    }
                    else
                    {
                        howManyInLoop = howMany % Config.recommendation.random_interactions_generation_page_size;
                        if(howManyInLoop === 0)
                        {
                            howManyInLoop = Config.recommendation.random_interactions_generation_page_size;
                        }
                    }

                    generateNRandomInteractions(howManyInLoop, user, function(err, interactions) {
                        if(isNull(err))
                        {
                            saveInteractions(interactions, function(err, results){
                                if(isNull(err))
                                {
                                    console.log("[Loop " + n + " of "+ howManyLoops + "] : Generated " + howManyInLoop + " interactions ");
                                }
                                else
                                {
                                    console.error("Error saving " + results.length + " random interactions to the database: " + results);
                                }

                                callback(null);
                            });
                        }
                        else
                        {
                            console.error("Error generating " + howManyInLoop + " Interactions in loop number " + n + " : " + interactions);
                            callback(null, interactions);
                        }
                    });

                },
                function(err)
                {
                    callback(err);
                }
            );
        };

        console.log("Generating " + howMany + " random interactions with the system in " + howManyLoops + " loops of " + Config.recommendation.random_interactions_generation_page_size + " interactions.");

        async.waterfall([
                function(callback)
                {
                    createSpecificUserArray(req.body.user, callback);
                },
                function(user, callback)
                {
                    generateInteractionsInLoop(howMany, howManyLoops, user, callback);
                }],
            function(err)
            {
                if(isNull(err))
                {
                    res.json({
                        result : "ok",
                        message : howMany + " interactions successfully sent to the Dendro Recommender system"
                    });

                }
                else
                {
                    console.error("Error generating random interactions!");

                    res.status(500).json({
                        result : "error",
                        message : "Error generating random interactions to push to the recommender system: " + err
                    });
                }
            });
    }
    else
    {
        res.status(500).json({
            result : "error",
            message : "Missing 'how_many' parameter at the root of the JSON object sent in the POST body"
        });
    }
};

exports.refresh_interactions = function(req, res)
{
    /**
     * Push all interactions
     */

    const now = new Date();
    const path = require("path");
    const appDir = path.dirname(require.main.filename);

    const dumpFileName = path.join(appDir, "temp", "interaction_dumps", now.toISOString() + ".txt");

    if(isNull(req.params.starting_instant_in_iso_format))
    {
        const fs = require("fs");
        const stream = fs.createWriteStream(dumpFileName);
        stream.once('open', function(fd) {

            stream.write("[");

            Interaction.all(
                function (err, interactions, callback)
                {
                    if (isNull(err))
                    {
                        const sendInteractionsArray = function(req, res, conn, interactions, callback)
                        {
                            InteractionMapper.map(interactions, function(err, mappedInteractions){
                                if(isNull(err))
                                {
                                    conn.send("POST", mappedInteractions, "/facts/new", function (err, result, body)
                                    {
                                        if (isNull(err))
                                        {
                                            callback(null, result);
                                            return res.json({
                                                result: "ok",
                                                messages : ["Interactions successfully pushed to Dendro Recommender"]
                                            });
                                        }
                                        else
                                        {
                                            if(!isNull(body) && body.message)
                                            {
                                                return res.status(500).json({
                                                    result: "error",
                                                    messages: ["Dendro Recommender is active but there were errors pushing the recommendations to the external system", body.message]
                                                });
                                            }
                                            else
                                            {
                                                return res.status(500).json({
                                                    result: "error",
                                                    messages: ["Dendro Recommender is active but there were unknown errors pushing the recommendations to the external system"]
                                                });
                                            }
                                        }
                                    });
                                }
                                else
                                {
                                    return res.status(500).json({
                                        result: "error",
                                        title : "Internal error",
                                        messages: ["Unable to map existing interactions to the Dendro Recommender's format. Error reported : " + mappedInteractions]
                                    });
                                }
                            });
                        };

                        sendInteractionsArray(req, res, conn, interactions, function(err, result){
                            if(isNull(err))
                            {
                                callback(err, result);
                            }
                            else
                            {
                                console.log("Error sending a page to Dendro Recommender " + result);
                            }
                         });
                    }
                    else
                    {
                        return res.status(500).json({
                            result: "error",
                            messages: ["Dendro Recommender is active but there were errors deleting all existing facts. Error reported: ", body.message]
                        });
                    }
                }, true);

            const conn = new DRConnection();

            conn.init(function(err, result)
            {
                if (isNull(err))
                {
                    conn.send("DELETE", {}, "/facts/all", function (err, result, body)
                    {
                        if (isNull(err))
                        {

                        }
                        else
                        {
                            res.status(500).json({
                                result: "error",
                                message: "Unable to fetch interactions to push to the recommender system."
                            });
                        }
                    });
                }
                else
                {
                    return res.status(500).json({
                        result: "error",
                        title : "No connection to Dendro Recommender",
                        messages: ["Unable to establish a connection to the specified Dendro Recommender instance. Check the instance status or the configuration file."]
                    });
                }
            });
            stream.end();
        });
    }
    /**
     * Push interactions that occurred after a certain date
     */
    else
    {
        //TODO filter interactions by date and send them to the Dendro Recommender system.
    }
};

exports.by_user = function(req, res)
{
    let username = req.params["username"];
    const currentUser = req.user;
    const acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if(!username)
    {
        username = currentUser.uri;
    }

    /**
     * normal users can only access their own information, admins
     * can access information of all users
     */
    if(req.params.username === username || currentUser.isOfClass("ddr:Administrator"))
    {
        if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
        {
            User.findByUsername(username, function(err, user){
                if(isNull(err))
                {
                    user.getInteractions(function(err, interactions){
                        if(isNull(err))
                        {
                            const cachedDescriptors = {};
                            const getFullDescriptor = function(interaction, callback){
                                //console.log("Getting full descriptor for uri " + interaction.ddr.executedOver);
                                const cachedDescriptor = cachedDescriptors[interaction.ddr.executedOver];

                                if(!isNull(cachedDescriptor))
                                {
                                    interaction.ddr.executedOver = cachedDescriptor;
                                    callback(null, interaction);
                                }
                                else
                                {
                                    Descriptor.findByUri(interaction.ddr.executedOver, function(err, fullDescriptor){
                                        if(isNull(err))
                                        {
                                            if(!isNull(fullDescriptor))
                                            {
                                                interaction.ddr.executedOver = fullDescriptor;
                                                cachedDescriptors[interaction.ddr.executedOver] = fullDescriptor;
                                                callback(null, interaction);
                                            }
                                            else //ignore invalid interactions
                                            {
                                                callback(null, null);
                                            }
                                        }
                                        else
                                        {
                                            callback(1, fullDescriptor);
                                        }
                                    });
                                }
                            };

                            let length = interactions.length;

                            console.log("Length of interactions array for user "+ user.uri +" : " + length);

                            async.map(interactions, getFullDescriptor, function(err, interactionsWithFullDescriptors){
                                if(isNull(err))
                                {
                                    interactionsWithFullDescriptors = _.compact(interactionsWithFullDescriptors);
                                    return res.json(interactionsWithFullDescriptors);
                                }
                                else
                                {
                                    res.status(500).json({
                                        result : "Error",
                                        message : "Error retrieving descriptor information for " + interactionsWithFullDescriptors
                                    });
                                }
                            });
                        }
                        else
                        {
                            res.status(500).json({
                                result : "Error",
                                message : "Error retrieving interactions of user " + username
                            });
                        }
                    });
                }
                else
                {
                    res.status(404).json({
                        result : "Error",
                        message : "Unable to find user " + username
                    });
                }
            });
        }
        else
        {
            const ejs = require('ejs');

            DendroRecommender.renderView(res, "interactions", {
                user : req.user,
                title : "Interactions recorded in the system"
            });
        }
    }
    else
    {
        if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
        {
            res.status(403).json({
                result : "Error",
                message : "You are not authorized to access information about a user different than yourself"
            });
        }
        else
        {
            req.flash('error', "Unauthorized access");
            console.log("You are not authorized to access information about a user different than yourself");
            res.redirect('/');
        }
    }
};