angular.module('dendroApp.controllers')
    /**
     *  Ontologies administration controller
     */
    .controller('ontologiesCtrl', function ($scope, $http, $filter)
    {
        $scope.get_public_ontologies = function()
        {
            $scope.get_ontologies(true);
        };

        $scope.get_all_ontologies = function()
        {
            ontologies.get_ontologies(false);
        };

        $scope.get_ontologies = function (public_only)
        {
            var url = "/ontologies/public";
            $scope.getting_ontologies = true;

            $http({
                method: 'GET',
                url: url,
                data: JSON.stringify({}),
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            }).then(function (response)
                {
                    var data = response.data;
                    if(data != null && data instanceof Array)
                    {
                        //console.log(JSON.stringify(data));
                        var ontologies = data;


                        for(var i = 0; i < ontologies.length; i++)
                        {
                            var researchDomains = ontologies[i].domain;

                            var formattedTags = [];

                            if(researchDomains != null)
                            {
                                if(typeof researchDomains === "string")
                                {
                                    researchDomains = [researchDomains];
                                }

                                if(researchDomains instanceof Array)
                                {
                                    for(var j = 0; j < researchDomains.length; j++)
                                    {
                                        var domainObject = {};
                                        domainObject.id = j;
                                        domainObject.text = researchDomains[j];
                                        formattedTags.push(domainObject);
                                    }

                                    ontologies[i].domain = formattedTags;
                                }
                                else
                                {
                                    Utils.show_popup("error", "Invalid response", "Research domains received are invalid.");
                                    ontologies = false;
                                }
                            }
                        }

                        if(public_only)
                        {
                            $scope.public_ontologies = ontologies;
                        }
                        else
                        {
                            $scope.all_ontologies = ontologies;
                        }

                        $scope.getting_ontologies = false;
                    }
                    else
                    {
                        Utils.show_popup("error", "Invalid response", "Server sent an invalid response when fetching list of ontologies");
                    }
                })
                .catch(function (data)
                {
                    Utils.show_popup("error", data.title, data.message);
                    $scope.getting_ontologies = false;
                });
        };

        $scope.get_ontologies_by_text_search = function(typed){
            //console.log("Typed : " + typed);

            ontologiesService.get_ontologies_by_text_search(function(ontologies){
                for(var i = 0; i < ontologies.length; i++)
                {
                    //format results for autocomplete library
                    ontologies[i].label = ontologies[i].title;
                    ontologies[i].comment = ontologies[i].description;
                }

                $scope.autocompleted_ontologies = ontologies;
            })
        };

        $scope.get_research_domains_by_text_search = function(typed){
            //console.log("Typed : " + typed);

            if(typeof typed != "undefined")
            {
                var requestUri = "/research_domains/autocomplete?query=" + typed;

                $http.get(requestUri);
            }
        };

        $scope.update_ontologies = function(ontology){
            //console.log(ontology);
            $http({
                method: "POST",
                url: "/ontologies/edit",
                data: ontology
            }).then(function(response) {
                var data = response.data;
                if(data.result == 'error' && data.message != null)
                {
                    Utils.show_popup("error", "Error", data.message);
                }
                else{
                    Utils.show_popup("ok", "Success", data.message);
                }

                $scope.get_ontologies();
            }).catch(function(error) {
                if(error.message != null)
                {
                    Utils.show_popup("error", "Error", error.message);
                }
            });
        };

        $scope.init = function(publicOntologiesOnly)
        {
            $scope.get_ontologies(publicOntologiesOnly);
        }
    });