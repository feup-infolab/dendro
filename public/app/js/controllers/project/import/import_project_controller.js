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
                $scope.validate = {
                    size: {max: '20MB', min: '10B'},
                    height: {max: 12000},
                    width: {max: 12000},
                    duration: {max: '5m'}
                };
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

                $scope.init = function ()
                {
                    var test = {
                        "resource": "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data",
                        "metadata": [
                            {
                                "prefix": "ddr",
                                "shortName": "fileExtension",
                                "ontology": "http://dendro.fe.up.pt/ontology/0.1/",
                                "uri": "http://dendro.fe.up.pt/ontology/0.1/fileExtension",
                                "prefixedForm": "ddr:fileExtension",
                                "type": 3,
                                "control": "input_box",
                                "private": true,
                                "locked": true,
                                "restorable": true,
                                "backuppable": true,
                                "value": "folder"
                            },
                            {
                                "prefix": "nie",
                                "shortName": "hasLogicalPart",
                                "ontology": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
                                "uri": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#hasLogicalPart",
                                "prefixedForm": "nie:hasLogicalPart",
                                "type": 1,
                                "control": "url_box",
                                "private": true,
                                "locked": true,
                                "backuppable": true,
                                "value": [
                                    "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data/datasets muito bons",
                                    "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data/teste fantastico2",
                                    "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data/e mais uns",
                                    "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data/teste fantastico"
                                ]
                            },
                            {
                                "prefix": "nie",
                                "shortName": "isLogicalPartOf",
                                "ontology": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
                                "uri": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#isLogicalPartOf",
                                "prefixedForm": "nie:isLogicalPartOf",
                                "type": 1,
                                "control": "url_box",
                                "private": true,
                                "locked": true,
                                "backuppable": true,
                                "value": "http://dendro-prd.fe.up.pt:3007/project/testeaimaria"
                            },
                            {
                                "prefix": "nie",
                                "shortName": "title",
                                "ontology": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
                                "uri": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#title",
                                "prefixedForm": "nie:title",
                                "type": 8,
                                "control": "input_box",
                                "private": true,
                                "locked": true,
                                "backuppable": true,
                                "value": "testeaimaria"
                            }
                        ],
                        "children": [
                            {
                                "resource": "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data/teste fantastico",
                                "metadata": [
                                    {
                                        "prefix": "ddr",
                                        "shortName": "fileExtension",
                                        "ontology": "http://dendro.fe.up.pt/ontology/0.1/",
                                        "uri": "http://dendro.fe.up.pt/ontology/0.1/fileExtension",
                                        "prefixedForm": "ddr:fileExtension",
                                        "type": 3,
                                        "control": "input_box",
                                        "private": true,
                                        "locked": true,
                                        "restorable": true,
                                        "backuppable": true,
                                        "value": "folder"
                                    },
                                    {
                                        "prefix": "nie",
                                        "shortName": "isLogicalPartOf",
                                        "ontology": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
                                        "uri": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#isLogicalPartOf",
                                        "prefixedForm": "nie:isLogicalPartOf",
                                        "type": 1,
                                        "control": "url_box",
                                        "private": true,
                                        "locked": true,
                                        "backuppable": true,
                                        "value": "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data"
                                    },
                                    {
                                        "prefix": "nie",
                                        "shortName": "title",
                                        "ontology": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
                                        "uri": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#title",
                                        "prefixedForm": "nie:title",
                                        "type": 8,
                                        "control": "input_box",
                                        "private": true,
                                        "locked": true,
                                        "backuppable": true,
                                        "value": "teste fantastico"
                                    }
                                ],
                                "children": []
                            },
                            {
                                "resource": "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data/teste fantastico2",
                                "metadata": [
                                    {
                                        "prefix": "ddr",
                                        "shortName": "fileExtension",
                                        "ontology": "http://dendro.fe.up.pt/ontology/0.1/",
                                        "uri": "http://dendro.fe.up.pt/ontology/0.1/fileExtension",
                                        "prefixedForm": "ddr:fileExtension",
                                        "type": 3,
                                        "control": "input_box",
                                        "private": true,
                                        "locked": true,
                                        "restorable": true,
                                        "backuppable": true,
                                        "value": "folder"
                                    },
                                    {
                                        "prefix": "nie",
                                        "shortName": "isLogicalPartOf",
                                        "ontology": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
                                        "uri": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#isLogicalPartOf",
                                        "prefixedForm": "nie:isLogicalPartOf",
                                        "type": 1,
                                        "control": "url_box",
                                        "private": true,
                                        "locked": true,
                                        "backuppable": true,
                                        "value": "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data"
                                    },
                                    {
                                        "prefix": "nie",
                                        "shortName": "title",
                                        "ontology": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
                                        "uri": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#title",
                                        "prefixedForm": "nie:title",
                                        "type": 8,
                                        "control": "input_box",
                                        "private": true,
                                        "locked": true,
                                        "backuppable": true,
                                        "value": "teste fantastico2"
                                    }
                                ],
                                "children": []
                            },
                            {
                                "resource": "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data/datasets muito bons",
                                "metadata": [
                                    {
                                        "prefix": "ddr",
                                        "shortName": "fileExtension",
                                        "ontology": "http://dendro.fe.up.pt/ontology/0.1/",
                                        "uri": "http://dendro.fe.up.pt/ontology/0.1/fileExtension",
                                        "prefixedForm": "ddr:fileExtension",
                                        "type": 3,
                                        "control": "input_box",
                                        "private": true,
                                        "locked": true,
                                        "restorable": true,
                                        "backuppable": true,
                                        "value": "folder"
                                    },
                                    {
                                        "prefix": "nie",
                                        "shortName": "hasLogicalPart",
                                        "ontology": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
                                        "uri": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#hasLogicalPart",
                                        "prefixedForm": "nie:hasLogicalPart",
                                        "type": 1,
                                        "control": "url_box",
                                        "private": true,
                                        "locked": true,
                                        "backuppable": true,
                                        "value": [
                                            "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data/datasets muito bons/ensaio nº 2",
                                            "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data/datasets muito bons/ensaio 3 e 4"
                                        ]
                                    },
                                    {
                                        "prefix": "nie",
                                        "shortName": "isLogicalPartOf",
                                        "ontology": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
                                        "uri": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#isLogicalPartOf",
                                        "prefixedForm": "nie:isLogicalPartOf",
                                        "type": 1,
                                        "control": "url_box",
                                        "private": true,
                                        "locked": true,
                                        "backuppable": true,
                                        "value": "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data"
                                    },
                                    {
                                        "prefix": "nie",
                                        "shortName": "title",
                                        "ontology": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
                                        "uri": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#title",
                                        "prefixedForm": "nie:title",
                                        "type": 8,
                                        "control": "input_box",
                                        "private": true,
                                        "locked": true,
                                        "backuppable": true,
                                        "value": "datasets muito bons"
                                    }
                                ],
                                "children": [
                                    {
                                        "resource": "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data/datasets muito bons/ensaio nº 2",
                                        "metadata": [
                                            {
                                                "prefix": "ddr",
                                                "shortName": "fileExtension",
                                                "ontology": "http://dendro.fe.up.pt/ontology/0.1/",
                                                "uri": "http://dendro.fe.up.pt/ontology/0.1/fileExtension",
                                                "prefixedForm": "ddr:fileExtension",
                                                "type": 3,
                                                "control": "input_box",
                                                "private": true,
                                                "locked": true,
                                                "restorable": true,
                                                "backuppable": true,
                                                "value": "folder"
                                            },
                                            {
                                                "prefix": "nie",
                                                "shortName": "isLogicalPartOf",
                                                "ontology": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
                                                "uri": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#isLogicalPartOf",
                                                "prefixedForm": "nie:isLogicalPartOf",
                                                "type": 1,
                                                "control": "url_box",
                                                "private": true,
                                                "locked": true,
                                                "backuppable": true,
                                                "value": "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data/datasets muito bons"
                                            },
                                            {
                                                "prefix": "nie",
                                                "shortName": "title",
                                                "ontology": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
                                                "uri": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#title",
                                                "prefixedForm": "nie:title",
                                                "type": 8,
                                                "control": "input_box",
                                                "private": true,
                                                "locked": true,
                                                "backuppable": true,
                                                "value": "ensaio nº 2"
                                            }
                                        ],
                                        "children": []
                                    },
                                    {
                                        "resource": "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data/datasets muito bons/ensaio 3 e 4",
                                        "metadata": [
                                            {
                                                "prefix": "dcterms",
                                                "shortName": "abstract",
                                                "ontology": "http://purl.org/dc/terms/",
                                                "uri": "http://purl.org/dc/terms/abstract",
                                                "prefixedForm": "dcterms:abstract",
                                                "type": 3,
                                                "control": "markdown_box",
                                                "value": "Ensaio 2 e 3"
                                            },
                                            {
                                                "prefix": "dcterms",
                                                "shortName": "title",
                                                "ontology": "http://purl.org/dc/terms/",
                                                "uri": "http://purl.org/dc/terms/title",
                                                "prefixedForm": "dcterms:title",
                                                "type": 3,
                                                "control": "input_box",
                                                "value": "Título muito bom - Ensaios 3 e 4"
                                            },
                                            {
                                                "prefix": "ddr",
                                                "shortName": "fileExtension",
                                                "ontology": "http://dendro.fe.up.pt/ontology/0.1/",
                                                "uri": "http://dendro.fe.up.pt/ontology/0.1/fileExtension",
                                                "prefixedForm": "ddr:fileExtension",
                                                "type": 3,
                                                "control": "input_box",
                                                "private": true,
                                                "locked": true,
                                                "restorable": true,
                                                "backuppable": true,
                                                "value": "folder"
                                            },
                                            {
                                                "prefix": "nie",
                                                "shortName": "isLogicalPartOf",
                                                "ontology": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
                                                "uri": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#isLogicalPartOf",
                                                "prefixedForm": "nie:isLogicalPartOf",
                                                "type": 1,
                                                "control": "url_box",
                                                "private": true,
                                                "locked": true,
                                                "backuppable": true,
                                                "value": "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data/datasets muito bons"
                                            },
                                            {
                                                "prefix": "nie",
                                                "shortName": "title",
                                                "ontology": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
                                                "uri": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#title",
                                                "prefixedForm": "nie:title",
                                                "type": 8,
                                                "control": "input_box",
                                                "private": true,
                                                "locked": true,
                                                "backuppable": true,
                                                "value": "ensaio 3 e 4"
                                            }
                                        ],
                                        "children": []
                                    }
                                ]
                            },
                            {
                                "resource": "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data/e mais uns",
                                "metadata": [
                                    {
                                        "prefix": "ddr",
                                        "shortName": "fileExtension",
                                        "ontology": "http://dendro.fe.up.pt/ontology/0.1/",
                                        "uri": "http://dendro.fe.up.pt/ontology/0.1/fileExtension",
                                        "prefixedForm": "ddr:fileExtension",
                                        "type": 3,
                                        "control": "input_box",
                                        "private": true,
                                        "locked": true,
                                        "restorable": true,
                                        "backuppable": true,
                                        "value": "folder"
                                    },
                                    {
                                        "prefix": "nie",
                                        "shortName": "isLogicalPartOf",
                                        "ontology": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
                                        "uri": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#isLogicalPartOf",
                                        "prefixedForm": "nie:isLogicalPartOf",
                                        "type": 1,
                                        "control": "url_box",
                                        "private": true,
                                        "locked": true,
                                        "backuppable": true,
                                        "value": "http://dendro-prd.fe.up.pt:3007/project/testeaimaria/data"
                                    },
                                    {
                                        "prefix": "nie",
                                        "shortName": "title",
                                        "ontology": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
                                        "uri": "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#title",
                                        "prefixedForm": "nie:title",
                                        "type": 8,
                                        "control": "input_box",
                                        "private": true,
                                        "locked": true,
                                        "backuppable": true,
                                        "value": "e mais uns"
                                    }
                                ],
                                "children": []
                            }
                        ]
                    };
                    $scope.backup_contents = $scope.transformForTreeControl(test);

                    // $scope.treedata = [{
                    //     name: "Node 1",
                    //     id : "#Node 1",
                    //     children: [{
                    //         name: "Node 1.1",
                    //         id : "#Node 1.1",
                    //         children:[
                    //             {
                    //                 id : "#Node 1.1.1",
                    //                 name:"Node 1.1.1"
                    //             },
                    //             {
                    //                 id: "#Node 1.1.2",
                    //                 name: "Node 1.1.2"
                    //             }]
                    //     }]
                    // },{
                    //     name: "Node 2",
                    //     id: "#Node 2",
                    //     children: [
                    //         {
                    //             id: "#Node 2.1",
                    //             name: "Node 2.1"
                    //         },
                    //         {
                    //             id: "#Node 2.2",
                    //             name: "Node 2.2"
                    //         }
                    //     ]
                    // }];

                    console.log($scope.backup_contents);
                    $scope.uploading = false;
                    $scope.stage = {analyse: true};
                }

                $scope.hasChangedDescriptors = function(node)
                {
                    if(node == null)
                    {
                        return false;
                    }

                    for (var i = 0; i < node.metadata.length; i++)
                    {
                        var descriptor = node.metadata[i];
                        if(!descriptor.locked && descriptor.value !== descriptor.newValue)
                        {
                            return true;
                        }
                    }

                    return false;
                }

                $scope.showSelected = function(sel) {
                    $scope.selectedNode = sel;
                };

                $scope.transformForTreeControl = function (metadataJSON)
                {
                    var transformedTree = [];

                    var getStructure = function (node)
                    {
                        var nodeTitle = jsonPath(node, "$.metadata[?(@.prefixedForm=='nie:title')]")[0].value;
                        var nodeExtension = jsonPath(node, "$.metadata[?(@.prefixedForm=='ddr:fileExtension')]")[0].value;

                        var treeNode = {
                            id: node.resource,
                            metadata : node.metadata,
                            has_changed_descriptors : $scope.hasChangedDescriptors(node),
                            children: []
                        };

                        if($scope.hasChangedDescriptors(node))
                        {
                            treeNode.name = '<span class="glyphicon glyphicon-exclamation-sign"></span>' + nodeTitle + "UIUI";
                        }
                        else
                        {
                            treeNode.name = nodeTitle;
                        }

                        if (node.children != null && node.children instanceof Array && node.children.length == 0)
                        {
                            return [];
                        }
                        else
                        {
                            var transformedChildren = [];

                            for (var i = 0; i < node.children.length; i++)
                            {
                                var child = node.children[i];
                                var childTitle = jsonPath(child, "$.metadata[?(@.prefixedForm=='nie:title')]")[0].value;

                                var childExtension = jsonPath(child, "$.metadata[?(@.prefixedForm=='ddr:fileExtension')]")[0].value;

                                var transformedChild = {
                                    id: child.resource,
                                    metadata : child.metadata,
                                    has_changed_descriptors : $scope.hasChangedDescriptors(node),
                                    children: []
                                };

                                if($scope.hasChangedDescriptors(node))
                                {
                                    transformedChild.name = '<span class="glyphicon glyphicon-exclamation-sign"></span>' + childTitle + "UIUI";
                                }
                                else
                                {
                                    transformedChild.name = childTitle;
                                }

                                if (childExtension === "folder")
                                {
                                    var grandChildren = JSON.parse(JSON.stringify(getStructure(child)));
                                    transformedChild.children = transformedChild.children.concat(grandChildren);
                                }

                                transformedChildren.push(transformedChild);
                            }

                            treeNode.children = transformedChildren;
                            return treeNode;
                        }
                    };

                    var transformedTree = [getStructure(metadataJSON)];

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
                                file.result = response.data;
                                $scope.backup_contents = response.data.backup_contents;
                                $scope.preview = $scope.transformForTreeControl($scope.backup_contents);
                                $scope.uploading = false;
                                $scope.stage = {analyse: true};
                            });
                        }, function (response)
                        {
                            if (response.status > 0)
                            {
                                $scope.errorMsg = response.status + ': ' + response.data;
                                windowService.show_popup("error", "Unable to upload.", "Error reported: " + $scope.errorMsg);
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
            }
    ]);