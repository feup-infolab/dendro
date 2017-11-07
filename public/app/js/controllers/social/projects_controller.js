angular.module('dendroApp.controllers')
/**
     *  Project administration controller
     */
    .controller('projectsCtrl', function ($scope, $window)
    {
        $scope.tab_changed = function (tabName)
        {
            var tabID = 'tab_changed:' + tabName;
            $scope.$broadcast(tabID);
        };
    });
