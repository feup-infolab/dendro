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
                $scope.upload_completed = function(result)
                {
                    $scope.uploading = false;
                };

                $scope.get_upload_url = function()
                {
                    return "/projects/import";
                };

                $scope.import_project = function(file)
                {
                    $scope.$broadcast('new_files_to_upload', [file]);
                };

                $scope.init = function ()
                {
                    $scope.projects_imported_with_errors = [];
                    $scope.projects_imported_successfully = [];
                    $scope.uploading = false;
                }
            }
        ]);