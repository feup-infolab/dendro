//this HAS TO BE A GLOBAL VAR https://github.com/sciactive/pnotify/issues/23
var stack_topright = {"dir1": "down", "dir2": "left", "push": "top"};

/**
 * Append controller to existing application
 */
angular.module('dendroApp.controller', [])

    /**
     * Dendro Recommender Plugin Controller (make sure that this identifier ---dendroRecommender.interactionsCtrl--- is unique for this plugin!)
     */
    .controller('dendroRecommender.interactionsCtrl', function ($scope, $http, $filter) {

        $scope.push_all_interactions_to_dendro_recommender = function()
        {
            /*if (confirm("Do you want to send all interaction records to Dendro Recommender?"))
            {*/
                $http.post("/plugins/dendro_recommender/push_interactions/all", {})
                    .success(function(data, status, headers, config) {
                        Utils.show_popup("success", "Success : Sent interactions to Dendro Recommender \n" + data.title, JSON.stringify(data.messages));
                    }).
                    error(function(data, status, headers, config) {
                        Utils.show_popup("error", "Error : Sending interactions to Dendro Recommender \n" + data.title, JSON.stringify(data.messages));
                    });
            //}
        };

        $scope.push_random_interactions_to_dendro_recommender = function()
        {
            /*if (confirm("Do you want to send all interaction records to Dendro Recommender?"))
             {*/

            var generation_parameters = JSON.parse(JSON.stringify($scope.random_generation_parameters));

            var included_ontology_uris = [];

            for(var i = 0; i < generation_parameters.included_ontologies.length; i++)
            {
                included_ontology_uris.push(generation_parameters.included_ontologies[i].uri);
            }

            generation_parameters.included_ontologies = included_ontology_uris;

            $http.post("/plugins/dendro_recommender/push_interactions/random",
                generation_parameters
            )
                .success(function(data, status, headers, config) {
                    Utils.show_popup("success", "Success : Sent interactions to Dendro Recommender \n" + data.title, JSON.stringify(data.messages));
                }).
                error(function(data, status, headers, config) {
                    Utils.show_popup("error", "Error : Sending interactions to Dendro Recommender \n" + data.title, JSON.stringify(data.messages));
                });
            //}
        };

        $scope.render_chart = function(mode)
        {
            $scope.mode = mode;

            if($scope.interactions != null)
            {

                if(mode == "per-descriptor")
                {
                    Interactions.renderUserInteractionsChart.perDescriptor("#container-descriptor", $scope.interactions);
                }
                else if(mode == "per-ontology")
                {
                    Interactions.renderUserInteractionsChart.perOntology("#container-ontology", $scope.interactions);
                }
                else if(mode == "per-time")
                {
                    Interactions.renderUserInteractionsChart.perTime("#container-time", $scope.interactions);
                }
            }
        };

        $scope.delete_all_interactions = function()
        {
            if(confirm("Do you want to delete ALL interactions recorded in the system?"))
            {
                var url = "/interactions/delete_all";

                $http({
                    method: 'DELETE',
                    url: url,
                    data: JSON.stringify({}),
                    contentType: "application/json",
                    headers: {'Accept': "application/json"}
                }).success(function(data) {
                    $scope.interactions = data;
                    $scope.render_chart('per-ontology');
                    $scope.render_chart('per-descriptor');
                })
                    .error(function(data){
                        Utils.show_popup("error", "Error occurred", JSON.stringify(data));
                    });
            }
        };

        $scope.get_interactions = function()
        {
            var url;

            if($scope.interactions_user != null)
            {
                url = "/plugins/dendro_recommender/interactions/user/" + $scope.interactions_user;
            }
            else
            {
                url = document.URL;
            }

            $http({
                method: 'GET',
                url: url,
                data: JSON.stringify({}),
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            }).success(function(data) {
                $scope.interactions = data;
                $scope.render_chart('per-ontology');
                $scope.render_chart('per-descriptor');
            })
            .error(function(data){
                Utils.show_popup("error", "Error occurred", JSON.stringify(data));
            });
        };

        $scope.reset_ontology_selections = function()
        {
            var url = "/ontologies/public";

            $http({
                method: 'GET',
                url: url,
                data: JSON.stringify({}),
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            }).success(function(data) {
                $scope.random_generation_parameters.included_ontologies = [];
                $scope.selected_ontologies_for_including = [];
                $scope.selected_ontologies_for_excluding = [];

                $scope.excluded_ontologies = data;
            })
            .error(function(data){
                Utils.show_popup("error", "Error occurred", JSON.stringify(response));
            });
        };

        $scope.include_ontologies = function()
        {
            for(var i = 0; i < $scope.selected_ontologies_for_including.length; i++)
            {
                var ontology = $scope.selected_ontologies_for_including[i];

                console.log(ontology);
                $scope.random_generation_parameters.included_ontologies.push(ontology);

                for(var j = 0; j < $scope.excluded_ontologies.length; j++)
                {
                    if($scope.excluded_ontologies[j].prefix == ontology.prefix)
                    {
                        $scope.excluded_ontologies.splice(j, 1);
                    }
                }

            }

            $scope.selected_ontologies_for_including = [];
        };

        $scope.exclude_ontologies = function()
        {
            for(var i = 0; i < $scope.selected_ontologies_for_excluding.length; i++)
            {
                var ontology = $scope.selected_ontologies_for_excluding[i];

                console.log(ontology);
                $scope.excluded_ontologies.push(ontology);

                for(var j = 0; j < $scope.random_generation_parameters.included_ontologies.length; j++)
                {
                    if($scope.random_generation_parameters.included_ontologies[j].prefix == ontology.prefix)
                    {
                        $scope.random_generation_parameters.included_ontologies.splice(j, 1);
                    }
                }
            }

            $scope.selected_ontologies_for_excluding = [];
        };

        $scope.init = function()
        {
            $scope.get_interactions();
            $scope.reset_ontology_selections();

            $.pnotify.defaults.styling = "bootstrap3";
            $.pnotify.defaults.history = false;
        };

        $scope.interactions_user = "jrocha";

        $scope.random_generation_parameters = {
            positive: true,
            negative: false,
            how_many : 20,
            user : "http://127.0.0.1:3001/user/jrocha"
        }
    });