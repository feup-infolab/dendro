angular.module("dendroApp.controllers")
    .controller("projectTreeViewerCtrl", function ($scope)
    {
        $scope.toggle = function (scope)
        {
            scope.toggle();
        };

        $scope.collapseAll = function ()
        {
            $scope.$broadcast("collapseAll");
        };

        $scope.expandAll = function ()
        {
            $scope.$broadcast("expandAll");
        };
    });
