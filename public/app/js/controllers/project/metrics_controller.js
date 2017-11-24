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
            filesService,
            metricsService
        ) {

            $scope.init = function () {
                $scope.loadData();
            };

            $scope.loadData = function () {
                metricsService.get_stats().
                then(function (response)
                {
                    let statsData = response.data;
                    $scope.data[0].push(statsData.folders_count);
                });
            };


            $scope.labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
            $scope.data = [
                [65, 1, 1, 1, 1, 1]
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

            $scope.randomize = function () {
                $scope.data = $scope.data.map(function (data) {
                    return data.map(function (y) {
                        y = y + Math.random() * 10 - 5;
                        return parseInt(y < 0 ? 0 : y > 100 ? 100 : y);
                    });
                });
            };
        });
