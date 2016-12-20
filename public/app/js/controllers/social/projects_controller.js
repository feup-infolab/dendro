angular.module('dendroApp.controllers')
    /**
     *  Project administration controller
     */
    .controller('projectsCtrl', function ($scope, $window)
    {
        $scope.tab_changed = function(tabName) {
            //$window.location.reload();
            $scope.$broadcast('tab_changed ' + tabName);
        };

        /*$scope.pageChangeHandler = function(num) {
            console.log('going to page ' + num);
        };*/

    });