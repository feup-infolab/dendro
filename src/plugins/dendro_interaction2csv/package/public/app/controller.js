//this HAS TO BE A GLOBAL VAR https://github.com/sciactive/pnotify/issues/23
var stack_topright = {"dir1": "down", "dir2": "left", "push": "top"};

/**
 * Append controller to existing application
 */
angular.module('dendroApp.controller', [])

    /**
     * dendroInteraction2CSV Plugin Controller (make sure that this identifier ---dendroInteraction2CSV.exportController--- is unique for this plugin!)
     */
    .controller('exportCtrl', function ($scope, $http, $filter) {

        $scope.get_current_url = function()
        {
            var newURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
            return newURL;
        };

        $scope.get_calling_uri = function(queryParametersString, uri)
        {
            if(uri != null)
            {
                if(queryParametersString != null)
                {
                    uri = uri + queryParametersString;
                }
            }
            else
            {
                if(queryParametersString != null)
                {
                    if($scope.shared.selected_file != null)
                    {
                        uri = $scope.shared.selected_file.uri + queryParametersString;
                    }
                    else
                    {
                        uri = $scope.get_current_url() + queryParametersString;
                    }
                }
                else
                {
                    if($scope.shared.selected_file != null)
                    {
                        uri = $scope.shared.selected_file.uri;
                    }
                    else
                    {
                        uri = $scope.get_current_url();
                    }
                }
            }

            return uri;
        };

        $scope.download_url = function(url, parametersString)
        {
            url = $scope.get_calling_uri(parametersString, url);

            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            };

            function guid() {
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                    s4() + '-' + s4() + s4() + s4();
            }

            var hiddenIFrameID = 'hiddenDownloader_' + guid();
            iframe = document.getElementById(hiddenIFrameID);
            if (iframe === null) {
                iframe = document.createElement('iframe');
                iframe.id = hiddenIFrameID;
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
            }
            iframe.src = url;
        };

        $scope.all = function()
        {
            if($scope.graph_uri == null || $scope.graph_uri === "undefined")
            {
                alert("No graph uri selected.");
            }
            else
            {
                if(confirm("Download interactions registered in graph " + $scope.graph_uri + " ?"))
                {
                    $scope.download_url("/plugins/dendro_interaction2csv/all", "?graph_uri=" + $scope.graph_uri);
                }
            }
        };

        $scope.average_metadata_sheet_size_per_interaction = function()
        {
            if($scope.graph_uri == null || $scope.graph_uri === "undefined")
            {
                alert("No graph uri selected.");
            }
            else
            {
                if (confirm("Download interactions registered in graph " + $scope.graph_uri + " ?"))
                {
                    $scope.download_url("/plugins/dendro_interaction2csv/average_metadata_sheet_size_per_interaction", "?graph_uri=" + $scope.graph_uri);
                }
            }
        };

        $scope.average_descriptor_length_per_interaction = function()
        {
            if($scope.graph_uri == null || $scope.graph_uri === "undefined")
            {
                alert("No graph uri selected.");
            }
            else
            {
                if (confirm("Download interactions registered in graph " + $scope.graph_uri + " ?"))
                {
                    $scope.download_url("/plugins/dendro_interaction2csv/average_descriptor_length_per_interaction", "?graph_uri=" + $scope.graph_uri);
                }
            }
        }

        $scope.total_number_of_descriptors_per_interaction = function()
        {
            if($scope.graph_uri == null || $scope.graph_uri === "undefined")
            {
                alert("No graph uri selected.");
            }
            else
            {
                if (confirm("Download interactions registered in graph " + $scope.graph_uri + " ?"))
                {
                    $scope.download_url("/plugins/dendro_interaction2csv/total_number_of_descriptors_per_interaction", "?graph_uri=" + $scope.graph_uri);
                }
            }
        }

        $scope.number_of_descriptors_of_each_type_per_interaction = function()
        {
            if($scope.graph_uri == null || $scope.graph_uri === "undefined")
            {
                alert("No graph uri selected.");
            }
            else
            {
                if (confirm("Download interactions registered in graph " + $scope.graph_uri + " ?"))
                {
                    $scope.download_url("/plugins/dendro_interaction2csv/number_of_descriptors_of_each_type_per_interaction", "?graph_uri=" + $scope.graph_uri);
                }
            }
        }
    });