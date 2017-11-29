angular.module('dendroApp.controllers')

/**
 * new project controller
 */
    .controller('metricsController',

        function ($scope,
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
                  metricsService) {

            $scope.init = function () {
                $scope.loadData();
            };

            $scope.loadData = function () {
                function getStats (uri)
                {
                    metricsService.get_stats(uri)
                        .then(function (response)
                        {
                            let statsData = response.data;
                            $scope.data[0].push(statsData.folders_count);
                        });
                }
                if ($scope.check_project_root())
                {
                    getStats($scope.get_calling_uri());
                }
                else
                {
                    $scope.get_owner_project()
                        .then(function (ownerProject)
                        {
                            if (ownerProject != null)
                            {
                                getStats(ownerProject.uri);
                            }
                        })
                        .catch(function (e)
                        {
                            console.log("error", "Unable to fetch parent project of the currently selected file.");
                            console.log("error", JSON.stringify(e));
                            windowService.show_popup("error", "Error", e.statusText);
                        });
                }

            };

            $scope.check_project_root = function ()
            {
                if ($scope.shared.selected_file != null)
                {
                    return false;
                }
                return $scope.shared.is_project_root;
            };

            $scope.labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
            $scope.data = [
                [1, 4, 3]
            ];
            $scope.colors = [
                { // grey
                    backgroundColor: 'rgba(148,159,177,0.2)',
                    pointBackgroundColor: 'rgba(148,159,177,1)',
                    pointHoverBackgroundColor: 'rgba(148,159,177,1)',
                    borderColor: 'rgba(148,159,177,1)',
                    pointBorderColor: '#fff',
                    pointHoverBorderColor: 'rgba(148,159,177,0.8)'
                },
                { // dark grey
                    backgroundColor: 'rgba(77,83,96,0.2)',
                    pointBackgroundColor: 'rgba(77,83,96,1)',
                    pointHoverBackgroundColor: 'rgba(77,83,96,1)',
                    borderColor: 'rgba(77,83,96,1)',
                    pointBorderColor: '#fff',
                    pointHoverBorderColor: 'rgba(77,83,96,0.8)'
                }
            ];

            $scope.updateData = function () {
                $scope.data = $scope.data.map(function (data) {
                    return data.map(function (y) {
                        y = y + Math.random() * 10 - 5;
                        return parseInt(y < 0 ? 0 : y > 100 ? 100 : y);
                    });
                });
            };
        });
