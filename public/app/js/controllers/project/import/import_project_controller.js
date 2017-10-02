angular.module('dendroApp.controllers')
    /**
     *  Descriptors List controller
     */
    .controller('importProjectCtrl',
        [
            '$scope',
            '$http',
            '$filter',
            '$q',
            '$log',
            '$localStorage',
            '$timeout',
            'uploadsService',
            'windowService',
            'jsonPath',
            function (
                $scope,
                $http,
                $filter,
                $q,
                $log,
                $localStorage,
                $timeout,
                uploadsService,
                windowService,
                jsonPath
            )
            {
                $scope.init = function ()
                {

                }
            }
        ]);