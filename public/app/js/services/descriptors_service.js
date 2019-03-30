angular.module("dendroApp.services")
    .service("descriptorsService", ["$http",
        function ($http)
        {
            const injectMissingCommentMessage = function (descriptors)
            {
                return _.map(descriptors, function (descriptor)
                {
                    if (!descriptor.comment)
                    {
                        descriptor.comment = "No detailed description available";
                    }
                    return descriptor;
                });
            };

            this.get_descriptors_by_text_search = function (current_resource_uri, typed)
            {
                if (typeof typed !== "undefined")
                {
                    return $http({
                        method: "GET",
                        params: {
                            descriptor_autocomplete: typed
                        },
                        url: current_resource_uri,
                        responseType: "json",
                        headers: {Accept: "application/json"}
                    })
                        .then(function (response)
                        {
                            return response.data.map(function (item)
                            {
                                return item;
                            });
                        })
                        .catch(function (error)
                        {
                            console.log("error", error);
                            throw error;
                        });
                }
            };

            this.get_descriptors_from_ontology = function (ontologyUri)
            {
                if (ontologyUri != null)
                {
                    return $http({
                        method: "GET",
                        params: {
                            from_ontology: ontologyUri
                        },
                        url: "/descriptors",
                        responseType: "json",
                        headers: {Accept: "application/json"}
                    }).then(function (response)
                    {
                        response.data.descriptors = injectMissingCommentMessage(response.data.descriptors);
                        return response.data.descriptors;
                    }
                    ).catch(function (error)
                    {
                        throw "Error fetching ontologies from ontology " + ontologyUri + " : " + JSON.stringify(error);
                    });
                }
            };

            this.get_descriptors_from_ontology_annotated_for_a_resource = function (ontologyUri, resourceUri)
            {
                if (ontologyUri != null)
                {
                    if (resourceUri != null)
                    {
                        return $http({
                            method: "GET",
                            params: {
                                descriptors_from_ontology: ontologyUri
                            },
                            url: resourceUri,
                            responseType: "json",
                            headers: {Accept: "application/json"}
                        }).then(function (response)
                        {
                            response.data.descriptors = injectMissingCommentMessage(response.data.descriptors);
                            return response.data.descriptors;
                        }
                        ).catch(function (error)
                        {
                            throw "Error fetching ontologies from ontology " + ontologyUri + " in the context of resource " + resourceUri + ": " + JSON.stringify(error);
                        });
                    }

                    return $http({
                        method: "GET",
                        params: {
                            from_ontology: ontologyUri
                        },
                        url: "/descriptors",
                        responseType: "json",
                        headers: {Accept: "application/json"}
                    }).then(function (response)
                    {
                        response.data.descriptors = injectMissingCommentMessage(response.data.descriptors);
                        return response.data.descriptors;
                    }
                    ).catch(function (error)
                    {
                        throw "Error fetching ontologies from ontology " + ontologyUri + " : " + JSON.stringify(error);
                    });
                }
            };

            this.descriptor_is_valid = function (descriptor)
            {
                var checkIfValueIsInTheAlternatives = function (value, alternatives)
                {
                    if (!(alternatives instanceof Array))
                    {
                        return false;
                    }
                    else if (typeof value === "string" || value instanceof String)
                    {
                        for (var i = 0; i < alternatives.length; i++)
                        {
                            if (value === alternatives[i])
                            {
                                return true;
                            }
                        }
                    }
                    return false;
                };

                if (descriptor.hasRegex)
                {
                    var regex = new RegExp(descriptor.hasRegex);
                    if (typeof descriptor.value === "string" || descriptor.value instanceof String)
                    {
                        if (!regex.exec(descriptor.value))
                        {
                            return false;
                        }
                        return true;
                    }
                    else if (descriptor.value instanceof Array)
                    {
                        for (var j = 0; j !== descriptor.value.length; j++)
                        {
                            if (!regex.exec(descriptor.value[j]))
                            {
                                return false;
                            }
                        }
                        return true;
                    }

                    // the descriptor is invalid because it is neither a string nor an array
                    return false;
                }
                if (descriptor.hasAlternative && descriptor.hasAlternative instanceof Array)
                {
                    if (typeof descriptor.value === "string" || descriptor.value instanceof String)
                    {
                        return checkIfValueIsInTheAlternatives(descriptor.value, descriptor.hasAlternative);
                    }
                    else if (descriptor.value instanceof Array)
                    {
                        var results = _.map(descriptor.value, function (descriptorValue)
                        {
                            return checkIfValueIsInTheAlternatives(descriptorValue, descriptor.hasAlternative);
                        });

                        var containsAFailedCheck = _.contains(results, false);
                        if (containsAFailedCheck)
                        {
                            return false;
                        }

                        return true;
                    }
                    return false;
                }

                return true;
            };
        }]);
