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
        usersService
    ) {


        $scope.get_users_by_text_search = function(typed) {
            var current_url = $scope.get_calling_uri();
            return usersService.get_users_by_text_search(current_url, typed);
        };

        $scope.select_user_from_autocomplete = function(suggestion, model, label)
        {
            if(suggestion != null && suggestion instanceof Object)
            {
                var autocompletedUser = JSON.parse(JSON.stringify(suggestion));
                autocompletedUser.just_added = true;


                $scope.accept_user_from_autocomplete(suggestion);
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

    });