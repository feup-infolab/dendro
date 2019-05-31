angular.module("dendroApp.controllers")
/*
    *  Notebook controller
    */
    .controller("notebookCtrl", function (
        $scope,
        $rootScope,
        $http,
        $filter,
        $q,
        $log,
        $timeout,
        $compile,
        Upload,
        focus,
        preview,
        $localStorage,
        metadataService,
        windowService,
        cacheService,
        filesService,
        interactionsService,
        ontologiesService,
        storageService,
        recommendationService,
        usersService,
        ContextMenuEvents,
        notebookService
    )
    {
        $scope.init = function ()
        {
            $scope.set_from_local_storage_and_then_from_value("upload_area_visible", false);
            $scope.set_from_local_storage_and_then_from_value("restore_area_visible", false);
            $scope.set_from_local_storage_and_then_from_value("cut_files", []);
            $scope.set_from_local_storage_and_then_from_value("copied_files", []);
            $scope.set_from_local_storage_and_then_from_value("showing_deleted_files", false, $scope, "shared");

            $scope.modelOptionsObj = {
                debounce: 100
            };

            $scope.multiple = true;

            $scope.pattern = "*";
            $scope.acceptSelect = true;
            $scope.disabled = false;
            $scope.capture = "camera";

            $scope.keepDistinct = true;
            $scope.maxFiles = 10;
            $scope.ignoreInvalid = false;

            $scope.allowDir = false;
            $scope.dropAvailable = true;
        };

        $scope.has_notebook = function ()
        {
            return false;
        };

        $scope.start_notebook = function ()
        {

/*            var uri = $scope.get_last_section_of_url($scope.get_calling_uri());

                var requestUri = $scope.get_host() + "/notebooks/new/";
                 window.open(requestUri);

                return $http({
                    method: "GET",
                    url: requestUri,
                    data: JSON.stringify({}),
                    contentType: "application/json",
                    headers: {Accept: "application/json"}
                }).then(function (response)
                {
                    console.log("Returned");
                    return response;
                });*/
        };
    });

