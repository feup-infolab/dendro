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
            $scope.stage = {upload: true};
            $scope.validate = {size: {max: '20MB', min: '10B'}, height: {max: 12000}, width: {max: 12000}, duration: {max: '5m'}};
            $scope.dragClass= {pattern: 'application/zip', accept:'upload-area-dropped-accept', reject:'upload-area-dropped-reject', delay:100};

            $scope.transformForTreeControl = function(metadataJSON)
            {
                var treeView = {};

                var getStructure = function(node)
                {
                    var treeNode = [];
                    if(node.children != null && node.children.length && node.children.length == 0)
                    {
                        return [];
                    }
                    else
                    {
                        //var childTitle = jsonPath(node, "metadata.)
                        var transformedChild = {label: childTitle, id: "some id", children: []};

                        for(var i = 0; i < node.children.length; i++)
                        {
                            var child = node.children[i];
                            if(child.metadata.prefixedForm === "ddr:fileExtension" && value === "folder")
                            {
                                var subTree = getStructure(child);
                                subTrees.push(subTree);
                            }
                            else
                            {

                            }
                        }

                        subTrees;
                    }
                };

                var children = getStructure(metadataJSON);

                $scope.treeView = {
                    label: "New Project",
                    id: metadataJSON["resource"],
                    children: children
                };
            }

            $scope.upload_for_importing = function(file) {
                $scope.file = file;
                $scope.uploading = true;

                uploadsService.upload (file, '/projects/import')
                    .then(function (response) {
                        $timeout(function () {
                            file.result = response.data;
                            $scope.backup_contents = response.data.backup_contents;
                            $scope.preview = $scope.transformForTreeControl($scope.backup_contents);
                            $scope.uploading = false;
                            $scope.stage = {analyse : true};
                        });
                    }, function (response) {
                        if (response.status > 0)
                        {
                            $scope.errorMsg = response.status + ': ' + response.data;
                            windowService.show_popup("error", "Unable to upload.", "Error reported: " + $scope.errorMsg );
                        }
                        $scope.uploading = false;
                    }, function (evt) {
                        file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                        $scope.upload_progress = file.progress;
                    })
                    .catch(function(e){
                        windowService.show_popup("error", "Unable to upload. Error reported: " + JSON.stringify(e));
                        $scope.uploading = false;
                    });
            }
        }
    ]);