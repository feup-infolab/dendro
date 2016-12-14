angular.module('dendroApp.controllers')
    /**
     *  Project administration controller
     */
    .controller('projectsCtrl', function ($scope)
    {
        $scope.tab_changed = function(tabName) {
            $scope.$broadcast('tab_changed ' + tabName);
        };

        /*$scope.pageChangeHandler = function(num) {
            console.log('going to page ' + num);
        };*/

    });