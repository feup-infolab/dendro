angular.module("dendroApp.controllers")
/**
     *  Research Domains administration controller
     */
    .controller("researchDomainsCtrl", function ($scope, $http, $filter)
    {
        $scope.get_research_domains = function ()
        {
            var url = "/research_domains";
            $scope.getting_research_domains = true;

            $http({
                method: "GET",
                url: url,
                data: JSON.stringify({}),
                contentType: "application/json",
                headers: {Accept: "application/json"}
            }).then(function (response)
            {
                var data = response.data;
                if (data != null && data instanceof Object)
                {
                    $scope.research_domains = data.research_domains;
                }
                else
                {
                    Utils.show_popup("error", "Invalid response", "Server sent an invalid response when fetching list of research domains");
                }

                $scope.getting_research_domains = false;
            })

                .catch(function (error)
                {
                    if (error.message != null && error.title != null)
                    {
                        Utils.show_popup("error", error.title, error.message);
                    }
                    else
                    {
                        Utils.show_popup("error", "Error occurred", JSON.stringify(error));
                    }

                    $scope.getting_research_domains = false;
                });
        };

        $scope.get_research_domains_by_text_search = function (typed)
        {
            // console.log("Typed : " + typed);

            if (typeof typed !== "undefined")
            {
                var requestUri = "/research_domains/autocomplete?query=" + typed;

                return $http.get(requestUri);
            }
        };

        $scope.add_research_domain = function ()
        {
            var defaultDomain = {
                dcterms:
          {
              description: "Engenharia Ambiental Descricao",
              title: "Engenharia Ambiental"
          },
                not_saved: true
            };

            if ($scope.research_domains instanceof Array)
            {
                $scope.research_domains.unshift(defaultDomain);
            }
            else
            {
                $scope.research_domains = [defaultDomain];
            }
        };

        $scope.remove_research_domain = function (index)
        {
            var research_domain = $scope.research_domains[index];

            if (research_domain.not_saved)
            {
                $scope.research_domains.splice(index, 1);
            }
            else
            {
                bootbox.confirm("Are you sure you wish to remove the research domain " + research_domain.uri + "?", function (confirmed)
                {
                    if (confirmed)
                    {
                        var url = "/research_domains/" + encodeURIComponent(research_domain.uri);
                        // console.log("Sending DELETE to url " + url);
                        $http({
                            method: "DELETE",
                            url: url,
                            data: research_domain
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
                            $scope.get_research_domains();
                        }).catch(function (error)
                        {
                            if (error.message != null && error.title != null)
                            {
                                Utils.show_popup("error", error.title, error.message);
                            }
                            else
                            {
                                Utils.show_popup("error", "Error occurred", JSON.stringify(error));
                            }

                            $scope.get_research_domains();
                        });
                    }
                });
            }
        };

        $scope.update_research_domains = function ()
        {
            // console.log("updating research domains with " + JSON.stringify($scope.research_domains));
            $http({
                method: "POST",
                url: "/research_domains",
                data: $scope.research_domains
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

                $scope.get_research_domains();
            }).catch(function (error)
            {
                if (error.message != null && error.title != null)
                {
                    Utils.show_popup("error", error.title, error.message);
                }
                else
                {
                    Utils.show_popup("error", "Error occurred", JSON.stringify(error));
                }

                $scope.get_research_domains();
            });
        };

        $scope.get_research_domains();
    });
