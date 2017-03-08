angular.module('dendroApp.controllers')
/**
 *  Descriptors List controller
 */
    .controller('UserListCtrl', function (
        $scope,
        $http,
        $filter,
        $q,
        $log,
        $sce,
        focus,
        preview,
        $localStorage,
        $timeout,
        metadataService,
        windowService,
        projectsService,
        usersService
    ) {

        $scope.contributors = [];


        $scope.get_users_by_text_search = function(typed) {
            var current_url = $scope.get_calling_uri();
            return usersService.get_users_by_text_search(current_url, typed);
        };

        $scope.select_user_from_autocomplete = function(suggestion, model, label)
        {
            if(model != null)
            {
                projectsService.add_contributor(model);
                window.location.reload();
                $scope.show_popup("success", "Success", "Project updated");

            }
        };

        $scope.get_calling_uri = function(queryParametersString, uri)
        {
            if(uri != null)
            {
                uri = uri + queryParametersString;
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
                        uri = windowService.get_current_url() + queryParametersString;
                    }
                }
                else
                {
                    uri = windowService.get_current_url();
                }
            }

            return uri;
        };


        $scope.get_contributors = function(contributors){
            var names = contributors.split(",");
            for(var i in names){
                $scope.contributors.push({"name":names[i], "remove": false});
            }
        }

        $scope.add_new_contributor = function(){
            $scope.contributors.push({"name":"", "remove": false});

        }

        $scope.update_contributors = function(){
            var contributors = [];
            for (var i = 0; i < $scope.contributors.length; i++){
                var person = $scope.contributors[i];
                if(!person.remove){
                    if(person.name != "") {
                        contributors.push(person.name);
                    }
                }
            }

            projectsService.update_contributors(contributors)
                .then(function (result){
                    location.reload();
                    $scope.show_popup("success", "Success", "Project updated");
                }).catch(function (error){
                    $scope.show_popup("error", "Error", error.message);
                });
        }

    });