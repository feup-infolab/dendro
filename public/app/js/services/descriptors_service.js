angular.module('dendroApp.services')
    .service('descriptorsService', ['$http',
        function ($http) {

        this.get_descriptors_by_text_search = function(current_resource_uri, typed) {

            if(typeof typed != "undefined")
            {
                return $http({
                    method: 'GET',
                    params : {
                        descriptor_autocomplete : typed
                    },
                    url: current_resource_uri,
                    responseType: 'json',
                    headers: {"Accept": "application/json"}
                })
                .then(function (response)
                {
                    return response.data.map(function(item){
                        return item;
                    });
                })
                .catch(function(error)
                {
                    console.error(error);
                    throw error;
                });
            }
        };

        this.get_descriptors_from_ontology = function(ontologyUri)
        {
            if(ontologyUri != null)
            {
                return $http({
                    method: 'GET',
                    params : {
                        from_ontology : ontologyUri
                    },
                    url: "/descriptors",
                    responseType: 'json',
                    headers: {"Accept": "application/json"}
                }).then(function(response) {
                        return response.data.descriptors;
                    }
                ).catch(function(error){
                    throw "Error fetching ontologies from ontology " + ontologyUri + " : " + JSON.stringify(error);
                });
            }
        };

        this.get_descriptors_from_ontology_annotated_for_a_resource = function(ontologyUri, resourceUri)
        {
            if(ontologyUri != null)
            {
                if(resourceUri != null)
                {
                    return $http({
                        method: 'GET',
                        params : {
                            "descriptors_from_ontology" : ontologyUri
                        },
                        url: resourceUri,
                        responseType: 'json',
                        headers: {"Accept": "application/json"}
                    }).then(function(response) {
                            return response.data.descriptors;
                        }
                    ).catch(function(error){
                        throw "Error fetching ontologies from ontology " + ontologyUri + " in the context of resource "+resourceUri+": " + JSON.stringify(error);
                    });
                }
                else
                {
                    return $http({
                        method: 'GET',
                        params : {
                            "from_ontology" : ontologyUri
                        },
                        url: "/descriptors",
                        responseType: 'json',
                        headers: {"Accept": "application/json"}
                    }).then(function(response) {
                            return response.data.descriptors;
                        }
                    ).catch(function(error){
                        throw "Error fetching ontologies from ontology " + ontologyUri + " : " + JSON.stringify(error);
                    });
                }


            }
        };

        this.descriptor_is_valid = function(descriptor)
        {
            if(descriptor.hasRegex)
            {
                var regex = new RegExp(descriptor.hasRegex);
                if (!regex.match(descriptor.value))
                {
                    return false;
                }
                else
                {
                    return true;
                }
            }
            else
            {
                if(descriptor.hasAlternative && descriptor.hasAlternative instanceof Array)
                {
                    for(var i = 0; i < descriptor.hasAlternative.length; i++)
                    {
                        if(descriptor.value === descriptor.hasAlternative[i])
                        {
                            return true;
                        }
                    }

                    return false;
                }

                return true;
            }
        }

    }]);