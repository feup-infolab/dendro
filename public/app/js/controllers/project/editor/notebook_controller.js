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
        $window,
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
        notebookService,
        Utils
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
            var uri = $scope.get_calling_uri();
                       

            bootbox.prompt("Please enter the name of the new Notebook", function (newNotebookName)
            {
                if (!Utils.isNull(newNotebookName))
                {
                    if (!newNotebookName.match(/^[^\\\/:*?"<>|]{1,}$/g))
                    {
                        bootbox.alert("Invalid Notebook name specified", function ()
                        {
                        });
                    }
                    else
                    {
                        if (!Utils.isNull(newNotebookName))
                        {
                            var notebookUrl = uri + "?create_notebook=" + newNotebookName;
                            console.log(notebookUrl);
                            return $http({
                                method: "POST",
                                url: notebookUrl,
                                contentType: "application/json",
                                headers: {Accept: "application/json"}
                            }).then(function (response)
                            {
                                console.log(response);
                                $window.location = response.data.new_notebook_url;
                                //$window.open(response.data.new_notebook_url);
                                console.log("Returned");
                                return response;
                            }).catch(function (error)
                            {
                                console.log("error", "Unable to create new Notebook " + JSON.stringify(error));
                                windowService.show_popup("error", " There was an error creating the new Notebook", "Server returned status code " + status + " and message :\n" + error);
                            });
                        }
                    }
                }
            });


            // var notebookUrl = uri + "?create_notebook=" + newNotebookName;
            //
            // return $http({
            //     method: "POST",
            //     url: notebookUrl,
            //     contentType: "application/json",
            //     headers: {Accept: "application/json"}
            // }).then(function (response)
            // {
            //     window.open(response.data.new_notebook_url);
            //     console.log("Returned");
            //     return response;
            // });
        };
    });

