angular.module('dendroApp.controllers')
    /**
     *  Project administration controller
     */
    .controller('projectAdminCtrl', function ($scope, $http, $filter)
    {
        $scope.get_project = function()
        {
            var url = $scope.get_current_url()+"?metadata&deep=true";

            $http({
                method: 'GET',
                url: url,
                data: JSON.stringify({}),
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            }).success(function(data) {
                    //console.log(data);
                    $scope.project = data;

                    for(var i = 0; i < $scope.project.descriptors.length; i++)
                    {
                        var descriptor = $scope.project.descriptors[i];
                        if(descriptor.prefixedForm == "ddr:deleted" && descriptor.value == true)
                        {
                            project.deleted = true;
                        }
                    }
                })
                .error(function(data){
                    Utils.show_popup("error", data.title, data.message);
                });
        };

        $scope.delete_project = function ()
        {
            //TODO ugly, convert this to the standard representation with the namespace (to enable if(project.ddr.deleted) ) later

            if($scope.project != null && $scope.project.descriptors != null)
            {
                if(project.deleted)
                    var uri = $scope.get_current_url() + "/undelete";
                else
                    var uri = $scope.get_current_url() + "/delete";

                //console.log("deleting " + get_current_url() + " via url " + uri);

                $http.post(uri)
                    .success(function(data) {
                        Utils.show_popup("success", data.title, data.message);
                    })
                    .error(function(data){
                        Utils.show_popup("error", data.title, data.message);
                    });
            }
        };

        $scope.project_data_uri = function(node){
            node.uri = $scope.get_current_url() + '/data';
        };

        $scope.get_project();
    });