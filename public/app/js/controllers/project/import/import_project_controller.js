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
                //$scope.stage = {upload: true};
                /*$scope.validate = {
                    size: {max: '20MB', min: '10B'},
                    height: {max: 12000},
                    width: {max: 12000},
                    duration: {max: '5m'}
                };*/

                $scope.dragClass = {
                    pattern: 'application/zip',
                    accept: 'upload-area-dropped-accept',
                    reject: 'upload-area-dropped-reject',
                    delay: 100
                };

                $scope.$on('selection-changed', function (e, node) {
                    //node - selected node in tree
                    $scope.selectedNode = node;
                });

                $scope.hasChangedDescriptors = function(node, transformedNode)
                {
                    if(node == null)
                    {
                        return false;
                    }

                    for (var i = 0; i < node.metadata.length; i++)
                    {
                        var oldDescriptor = node.metadata[i];
                        var newDescriptor = transformedNode.metadata[i];

                        if(!oldDescriptor.locked && newDescriptor.locked)
                        {
                            if(oldDescriptor.value !== newDescriptor.value)
                            {
                                return true;
                            }
                        }
                    }

                    return false;
                }

                $scope.showSelected = function(sel) {
                    $scope.selectedNode = sel;
                };

                $scope.transformForTreeControl = function (originalMetadataJSON, transformedMetadataJSON)
                {
                    var addMigratedValues = function(nodeMetadata, migratedNodeMetadata)
                    {
                        for(var i = 0; i < nodeMetadata.length; i++)
                        {
                            nodeMetadata[i].newValue = migratedNodeMetadata[i].value;
                        }
                    }

                    var getStructure = function (node, migratedNode)
                    {
                        var nodeTitle = jsonPath(node, "$.metadata[?(@.prefixedForm=='nie:title')]")[0].value;
                        var nodeExtension = jsonPath(node, "$.metadata[?(@.prefixedForm=='ddr:fileExtension')]")[0].value;

                        addMigratedValues(node.metadata, migratedNode.metadata);

                        var treeNode = {
                            id: node.resource,
                            metadata : node.metadata,
                            name : nodeTitle,
                            children: [],
                            image : $scope.get_extension_icon(nodeExtension)
                        };

                        if($scope.hasChangedDescriptors(node, migratedNode))
                        {
                            treeNode.badge = {
                                "type" : "label-warning",
                                "title" : "Changed Metadata"
                            };
                        }

                        if (node.children != null && node.children instanceof Array && node.children.length == 0)
                        {
                            return treeNode;
                        }
                        else
                        {
                            var transformedChildren = [];

                            for (var i = 0; i < node.children.length; i++)
                            {
                                var child = node.children[i];
                                var migratedChild = migratedNode.children[i];
                                
                                var childTitle = jsonPath(child, "$.metadata[?(@.prefixedForm=='nie:title')]")[0].value;
                                var childExtension = jsonPath(child, "$.metadata[?(@.prefixedForm=='ddr:fileExtension')]")[0].value;

                                addMigratedValues(child.metadata, migratedChild.metadata);

                                var transformedChild = {
                                    id: child.resource,
                                    metadata : child.metadata,
                                    has_changed_descriptors : $scope.hasChangedDescriptors(node, migratedNode),
                                    name : childTitle,
                                    children: [],
                                    image : $scope.get_extension_icon(childExtension)
                                };

                                if($scope.hasChangedDescriptors(child, migratedChild))
                                {
                                    transformedChild.badge = {
                                        "type" : "label-warning",
                                        "title" : "Changed Metadata"
                                    };
                                }

                                if (child.children != null && child.children instanceof Array && child.children.length > 0)
                                {
                                    var grandChildren = JSON.parse(JSON.stringify(getStructure(child, migratedChild)));
                                    transformedChild.children = transformedChild.children.concat(grandChildren);
                                }
                                else
                                {
                                    transformedChild.children = [];
                                }

                                transformedChildren.push(transformedChild);
                            }

                            treeNode.children = transformedChildren;
                            return treeNode;
                        }
                    }

                    var transformedTree = [getStructure(originalMetadataJSON, transformedMetadataJSON)];
                    return transformedTree;
                }

                $scope.upload_for_importing = function (file)
                {
                    $scope.file = file;
                    $scope.uploading = true;

                    uploadsService.upload(file, '/projects/import')
                        .then(function (response)
                        {
                            $timeout(function ()
                            {
                                //try{
                                    $scope.uploading = false;
                                    file.result = response.data;
                                    $scope.backup_contents = $scope.transformForTreeControl(response.data.original_contents, response.data.modified_contents);
                                    $scope.stage = {analyse: true};
                                //}
                                //catch(e)
                                //{
                                //    $scope.backup_contents = null;
                                //    windowService.show_popup("warning", "Error. ", "There was an error processing your backup file, because it does not have the expected structure.\n" + e.message);
                                //}
                            });
                        }, function (response)
                        {
                            if (response.status > 0)
                            {
                                $scope.errorMsg = response.status + ': ' + response.data;
                                windowService.show_popup("error", "Unable to upload due to timeout.", "Error reported: " + $scope.errorMsg);
                            }
                            $scope.uploading = false;
                        }, function (evt)
                        {
                            file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                            $scope.upload_progress = file.progress;
                        })
                        .catch(function (e)
                        {
                            windowService.show_popup("error", "Unable to upload. Error reported: " + JSON.stringify(e));
                            $scope.uploading = false;
                        });
                }

                $scope.buttonClick = function (event, node)
                {
                    console.log(JSON.stringify(event));
                };

                $scope.switch = function(targetStage)
                {
                    function setStage(targetStage)
                    {
                        $scope.stage = {};
                        $scope.stage[targetStage] = true;
                    }

                    switch(targetStage)
                    {
                        case 'upload' :
                        {
                            setStage(targetStage);
                            break;
                        }
                        case 'analyse' :
                        {
                            if ($scope.backup_contents != null)
                            {
                                setStage(targetStage);
                            }
                            else
                            {
                                windowService.show_popup('warning', 'No file uploaded', 'Please upload a backup file');
                            }
                            break;
                        }
                        case 'confirm' :
                        {
                            if ($scope.backup_contents != null)
                            {
                                setStage(targetStage);
                            }
                            else
                            {
                                windowService.show_popup('warning', 'No file uploaded', 'Please upload a backup file')
                            }
                            break;
                        }
                    }
                }

                $scope.init = function ()
                {
                    $scope.uploading = false;
                    $scope.stage = {upload: true};
                }
            }
        ]);