angular.module("dendroApp.controllers")
/**
     *  Descriptors List controller
     */
    .controller("importProjectCtrl",
        [
            "$scope",
            "$http",
            "$filter",
            "$q",
            "$log",
            "$localStorage",
            "$timeout",
            "uploadsService",
            "windowService",
            "jsonPath",
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
                $scope.upload_completed = function (err, result)
                {
                    $scope.uploading = false;
                    $scope.result = result;

                    if (!err)
                    {
                        if (result instanceof Array && result.length === 1)
                        {
                            window.location = result[0].data.new_project;
                        }
                    }
                    else
                    {
                        $scope.file = result.file;
                    }
                };

                $scope.get_upload_url = function ()
                {
                    return "/projects/import";
                };

                $scope.import_project = function (file, imported_project_handle, imported_project_title)
                {
                    file.imported_project_handle = imported_project_handle;
                    file.imported_project_title = imported_project_title;
                    $scope.$broadcast(
                        "new_files_to_upload",
                        [file]
                    );
                };

                $scope.init = function ()
                {
                    $scope.projects_imported_with_errors = [];
                    $scope.projects_imported_successfully = [];
                    $scope.uploading = false;
                    $scope.file = {};
                };
            }
        ]);
