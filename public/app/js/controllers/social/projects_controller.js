angular.module('dendroApp.controllers')
    /**
     *  Project administration controller
     */
    .controller('projectsCtrl', function ($scope, $window)
    {
        $scope.tab_changed = function(tabName) {
            //$window.location.reload();
            //$scope.$broadcast('tab_changed ' + tabName);
            var tabID = "tab_changed " + tabName;

            $scope.$broadcast(tabID, null);
        };

        /*$scope.pageChangeHandler = function(num) {
            console.log('going to page ' + num);
        };*/

    });