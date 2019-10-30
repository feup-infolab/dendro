angular.module("dendroApp.controllers")
/**
     *  Ontologies administration controller
     */
    .controller("ontologiesCtrl",
        function (
            $scope,
            $http,
            $filter,
            ontologiesService)
        {
            $scope.get_ontologies = function ()
            {
                if ($scope.public_ontologies_only)
                {
                    $scope.get_public_ontologies();
                }
                else
                {
                    $scope.get_all_ontologies();
                }
            };

            $scope.processOntologiesResponse = function (data)
            {
                if (data != null && data instanceof Array)
                {
                    $scope.ontologies = ontologies = data;

                    for (var i = 0; i < ontologies.length; i++)
                    {
                        var researchDomains = ontologies[i].ddr.hasResearchDomain;

                        var formattedTags = [];

                        if (researchDomains != null)
                        {
                            if (typeof researchDomains === "string")
                            {
                                researchDomains = [researchDomains];
                            }

                            if (researchDomains instanceof Array)
                            {
                                for (var j = 0; j < researchDomains.length; j++)
                                {
                                    var domainObject = {};
                                    domainObject.id = j;
                                    domainObject.text = researchDomains[j];
                                    formattedTags.push(domainObject);
                                }

                                ontologies[i].ddr.hasResearchDomain = formattedTags;
                            }
                            else
                            {
                                Utils.show_popup("error", "Invalid response", "Research domains received are invalid.");
                                ontologies = false;
                            }
                        }
                    }
                }
            };

            $scope.get_public_ontologies = function ()
            {
                $scope.get_public_ontologies()
                    .then(function (response)
                    {
                        $scope.processOntologiesResponse(response);
                    })
                    .catch(function (data)
                    {
                        Utils.show_popup("error", data.title, data.message);
                        $scope.getting_ontologies = false;
                    });
            };

            $scope.get_all_ontologies = function ()
            {
                ontologiesService.get_all_ontologies().then(function (response)
                {
                    $scope.processOntologiesResponse(response);
                });
            };

            $scope.get_ontologies_by_text_search = function (typed)
            {
            // console.log("Typed : " + typed);

                ontologiesService.get_ontologies_by_text_search(function (ontologies)
                {
                    for (var i = 0; i < ontologies.length; i++)
                    {
                        // format results for autocomplete library
                        ontologies[i].label = ontologies[i].title;
                        ontologies[i].comment = ontologies[i].description;
                    }

                    $scope.autocompleted_ontologies = ontologies;
                });
            };

            $scope.get_research_domains_by_text_search = function (typed)
            {
                if (typeof typed !== "undefined")
                {
                    var requestUri = "/research_domains/autocomplete?query=" + typed;
                    return $http.get(requestUri)
                        .then(function (response)
                        {
                            _.map(response.data, function (researchDomain)
                            {
                                researchDomain.tag_face = researchDomain.dcterms.title;
                            });

                            return response;
                        }).catch(function (error)
                        {
                            Utils.show_popup("error", "Invalid response", "Error occurred while searching for research domains.");
                            console.log(error);
                        });
                }
            };

            $scope.update_ontologies = function (ontology)
            {
            // console.log(ontology);
                $http({
                    method: "POST",
                    url: "/ontologies/edit",
                    data: ontology
                }).then(function (response)
                {
                    var data = response.data;
                    if (data.result == "error" && data.message != null)
                    {
                        Utils.show_popup("error", "Error", data.message);
                    }
                    else
                    {
                        Utils.show_popup("ok", "Success", data.message);
                    }

                    $scope.get_ontologies();
                }).catch(function (error)
                {
                    if (error.message != null)
                    {
                        Utils.show_popup("error", "Error", error.message);
                    }
                });
            };

            $scope.init = function ()
            {
                $scope.get_ontologies();
            };
        });
