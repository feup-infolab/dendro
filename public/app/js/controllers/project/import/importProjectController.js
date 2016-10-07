angular.module('dendroApp.controllers')
    /**
     *  Descriptors List controller
     */
    .controller('changeLogController', function (
        $scope,
        $http,
        $filter,
        $q,
        $log,
        $localStorage,
        $timeout,
        projectService,
        windowService,
        filesService
    )
    {
        $scope. = function (version)
        {
            projectService.get_(
                $scope.get_calling_uri(), version
            );
        };
    });