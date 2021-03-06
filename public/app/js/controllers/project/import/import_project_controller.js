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
            "projectsService",
            "jsonPath",
            "Utils",
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
                projectsService,
                jsonPath,
                Utils
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
                            // window.location = result[0].data.new_project;
                            window.location = "/projects/my";
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
                    file.runAsJob = true;

                    projectsService.get_project_info_by_handle(file.imported_project_handle)
                        .then(function (response)
                        {
                            Utils.show_popup("error", "Project handle already exists!", "Please try another project handle!");
                        })
                        .catch(function (error)
                        {
                            if (error.status == 404)
                            {
                                $scope.$broadcast(
                                    "new_files_to_upload",
                                    [file]
                                );
                            }
                            else
                            {
                                Utils.show_popup("error", "Error when finding if project handle is unique", JSON.stringify(error));
                            }
                        });
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
