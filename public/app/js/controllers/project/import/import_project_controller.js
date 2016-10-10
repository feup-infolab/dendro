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

            $scope.init = function()
            {
                var test = {
                    "resource": "http://rdm-demo.up.pt:3000/project/thesisphd/data",
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
                                "http://rdm-demo.up.pt:3000/project/thesisphd/data/dcb2.owl",
                                "http://rdm-demo.up.pt:3000/project/thesisphd/data/dl20140_submission_53.pdf",
                                "http://rdm-demo.up.pt:3000/project/thesisphd/data/Ontologies"
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
                            "value": "http://rdm-demo.up.pt:3000/project/thesisphd"
                        }
                    ],
                    "children": [
                        {
                            "resource": "http://rdm-demo.up.pt:3000/project/thesisphd/data/Ontologies",
                            "metadata": [
                                {
                                    "prefix": "dcterms",
                                    "shortName": "accessRights",
                                    "ontology": "http://purl.org/dc/terms/",
                                    "uri": "http://purl.org/dc/terms/accessRights",
                                    "prefixedForm": "dcterms:accessRights",
                                    "type": 3,
                                    "control": "input_box",
                                    "value": "Creative Commons"
                                },
                                {
                                    "prefix": "dcterms",
                                    "shortName": "creator",
                                    "ontology": "http://purl.org/dc/terms/",
                                    "uri": "http://purl.org/dc/terms/creator",
                                    "prefixedForm": "dcterms:creator",
                                    "type": 1,
                                    "control": "url_box",
                                    "value": "João Aguiar Castro"
                                },
                                {
                                    "prefix": "dcterms",
                                    "shortName": "description",
                                    "ontology": "http://purl.org/dc/terms/",
                                    "uri": "http://purl.org/dc/terms/description",
                                    "prefixedForm": "dcterms:description",
                                    "type": 3,
                                    "control": "markdown_box",
                                    "value": "A collection of domain-specific lightweight ontologies for research data description. These ontologies can be combined with each other, or with others, like Dublin Core or FOAF, for a more comprehensive description. The ontologies were created in collaboration with researchers from scientific domains such as Computational Fluid Dynamics, Analytical Chemistry, Biodiversity among others."
                                },
                                {
                                    "prefix": "dcterms",
                                    "shortName": "title",
                                    "ontology": "http://purl.org/dc/terms/",
                                    "uri": "http://purl.org/dc/terms/title",
                                    "prefixedForm": "dcterms:title",
                                    "type": 3,
                                    "control": "input_box",
                                    "value": "Lightweight ontologies for research data description"
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
                                        "http://rdm-demo.up.pt:3000/project/thesisphd/data/Ontologies/achem.owl",
                                        "http://rdm-demo.up.pt:3000/project/thesisphd/data/Ontologies/BIODIV_17Jun_1557.owl"
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
                                    "value": "http://rdm-demo.up.pt:3000/project/thesisphd/data"
                                }
                            ],
                            "children": [
                                {
                                    "resource": "http://rdm-demo.up.pt:3000/project/thesisphd/data/Ontologies/achem.owl",
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
                                            "value": "owl"
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
                                            "value": "http://rdm-demo.up.pt:3000/project/thesisphd/data/Ontologies"
                                        }
                                    ]
                                },
                                {
                                    "resource": "http://rdm-demo.up.pt:3000/project/thesisphd/data/Ontologies/BIODIV_17Jun_1557.owl",
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
                                            "value": "owl"
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
                                            "value": "http://rdm-demo.up.pt:3000/project/thesisphd/data/Ontologies"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "resource": "http://rdm-demo.up.pt:3000/project/thesisphd/data/dcb2.owl",
                            "metadata": [
                                {
                                    "prefix": "dcterms",
                                    "shortName": "audience",
                                    "ontology": "http://purl.org/dc/terms/",
                                    "uri": "http://purl.org/dc/terms/audience",
                                    "prefixedForm": "dcterms:audience",
                                    "type": 3,
                                    "control": "input_box",
                                    "value": "Researchers; Librarians"
                                },
                                {
                                    "prefix": "dcterms",
                                    "shortName": "description",
                                    "ontology": "http://purl.org/dc/terms/",
                                    "uri": "http://purl.org/dc/terms/description",
                                    "prefixedForm": "dcterms:description",
                                    "type": 3,
                                    "control": "markdown_box",
                                    "value": "This ontology model concepts that can be used to describe datasets created in Double Cantilever Beam experiments. The list of descriptors include concepts like temperature, moisture, velocity test. The concepts are not exclusive to this domain, meaning that the concepts can be reuse to describe datasets from other experiments, or research configuration. This ontology is not expected to fully represent the concepts that can be used to describe DCB´s experiments datasets. For a more detailed description elements can be drawn from other description resources (e.g. Dublin Core elements)."
                                },
                                {
                                    "prefix": "dcterms",
                                    "shortName": "title",
                                    "ontology": "http://purl.org/dc/terms/",
                                    "uri": "http://purl.org/dc/terms/title",
                                    "prefixedForm": "dcterms:title",
                                    "type": 3,
                                    "control": "input_box",
                                    "value": "Double Cantilver Beam experiments ontology"
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
                                    "value": "owl"
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
                                    "value": "http://rdm-demo.up.pt:3000/project/thesisphd/data"
                                },
                                {
                                    "prefix": "bdv",
                                    "shortName": "metadataPointOfContactEmail",
                                    "ontology": "http://dendro.fe.up.pt/ontology/BIODIV/0.1#",
                                    "uri": "http://dendro.fe.up.pt/ontology/BIODIV/0.1#metadataPointOfContactEmail",
                                    "prefixedForm": "bdv:metadataPointOfContactEmail",
                                    "type": 3,
                                    "control": "input_box",
                                    "value": "joaoaguiarcastro@gmail.com"
                                }
                            ]
                        },
                        {
                            "resource": "http://rdm-demo.up.pt:3000/project/thesisphd/data/dl20140_submission_53.pdf",
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
                                    "value": "pdf"
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
                                    "value": "http://rdm-demo.up.pt:3000/project/thesisphd/data"
                                }
                            ]
                        }
                    ]
                };
                $scope.transformForTreeControl(test);
            }

            $scope.transformForTreeControl = function(metadataJSON)
            {
                var transformedTree = [];

                var getStructure = function(node)
                {
                    var treeNode = [];
                    if(node.children != null && node.children.length && node.children.length == 0)
                    {
                        return [];
                    }
                    else
                    {
                        for(var i = 0; i < node.children.length; i++)
                        {
                            var child = node.children[i];
                            var childTitle = jsonPath(child, "$.metadata[?(@.prefixedForm=='dcterms:title')]")[0].value;
                            var childExtension = jsonPath(child, "$.metadata[?(@.prefixedForm=='ddr:fileExtension')]")[0].value;

                            var transformedChild = { label: childTitle, id: child.resource, children: [] };
                            transformedTree.push(transformedChild);

                            if(childExtension === "folder")
                            {
                                var children = getStructure(child);
                                transformedChild.children.concat(children);
                            }
                        }
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