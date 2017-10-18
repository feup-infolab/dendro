angular.module('dendroApp.controllers')

/**
 * new project controller
 */
    .controller('metricsController',

        function (

            $scope,
            $http,
            $filter,
            $q,
            $log,
            $sce,
            focus,
            preview,
            $localStorage,
            $timeout,
            metadataService,
            windowService,
            filesService
        ) {
            $scope.testvar = 2;
            $scope.labels = ["Download Sales", "In-Store Sales", "Numero de pastas"];
            $scope.data = [1, 4, 3, $scope.testvar];
            $scope.colours = [ '#803690', '#00ADF9', '#17ed6d'];



            $scope.get_project_stats = function()
            {
                function getStats(uri)
                {
                    filesService.get_stats(uri)
                        .then(function(response)
                        {
                            $scope.shared.project_stats = response.data;
                        });
                };

                if($scope.showing_project_root())
                {
                    getStats($scope.get_calling_uri());
                }
                else
                {
                    $scope.get_owner_project()
                        .then(function(ownerProject)
                        {
                            if(ownerProject != null)
                            {
                                getStats(ownerProject.uri);
                            }
                        })
                        .catch(function(e){
                            console.error("Unable to fetch parent project of the currently selected file.");
                            console.error(JSON.stringify(e));
                            windowService.show_popup("error", "Error", e.statusText);
                        });
                }
            };

        });
