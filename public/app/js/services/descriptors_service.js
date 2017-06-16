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
                    headers: {'Accept': "application/json"}
                })
                .then(function (response)
                {
                    return response.data.map(function(item){
                        return item;
                    });
                })
                .catch(function(error)
                {
                    console.error("Unable to fetch autocompleted descriptors. Query was: " + typed + " Error : " + JSON.stringify(error));
                    $scope.autocompleted_descriptors = [];
                });
            }
        };

        this.get_descriptors_from_ontology = function(ontologyPrefix)
        {
            if(ontologyPrefix != null)
            {
                var requestUri = "/descriptors/from_ontology/"+ontologyPrefix;
                var projectHandle = Utils.getCurrentProjectHandle();

                return $http({
                    method: 'GET',
                    params : {
                        project_handle : projectHandle
                    },
                    url: requestUri,
                    responseType: 'json',
                    headers: {'Accept': "application/json"}
                }).then(function(response) {
                        return response.data.descriptors;
                    }
                ).catch(function(error){
                    throw "Error fetching ontologies from ontology " + ontologyPrefix + " : " + JSON.stringify(error);
                });
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