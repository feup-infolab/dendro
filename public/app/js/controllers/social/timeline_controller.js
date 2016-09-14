angular.module('dendroApp.controllers')
    /**
     *  Project administration controller
     */
    .controller('timelineCtrl', function ($scope, $http, $filter, timelineService)
    {

        $scope.get_all_posts = function()
        {
            $scope.getting_posts = true;

            timelineService.get_all_posts()
                .then(function(response)
                {
                    $scope.posts = response.data;
                    $scope.getting_posts = false;
                })
                .catch(function(error){
                    console.error("Error getting posts " + JSON.stringify(error));
                    $scope.getting_posts = false;
                });
        };

        $scope.new_post = function()
        {
            $scope.posting_new_post = true;

            timelineService.new_post($scope.new_post_content)
                .then(function(response)
                {
                    $scope.show_popup(response.data.message);

                    $scope.get_all_posts();
                    $scope.posting_new_post = true;
                })
                .catch(function(error){
                    console.error("Error creating new post" + JSON.stringify(error));
                    $scope.posting_new_post = true;
                });
        };

        $scope.init = function()
        {
            $scope.new_post_content = "";
            $scope.get_all_posts();
        };

        $scope.show_popup = function(type, title, message)
        {
            if(type == "success")
            {
                new PNotify({
                    title: title,
                    text: message,
                    type: 'success',
                    opacity: 1.0,
                    delay: 2000,
                    addclass: "stack-bar-top",
                    cornerclass: "",
                    stack: stack_topright
                });
            }
            else if(type == "error")
            {
                new PNotify({
                    title: title,
                    text: message,
                    type: 'error',
                    opacity: 1.0,
                    delay: 5000,
                    addclass: "stack-bar-top",
                    cornerclass: "",
                    stack: stack_topright
                });
            }
            else if(type == "info")
            {
                new PNotify({
                    title: title,
                    text: message,
                    type: 'info',
                    opacity: 1.0,
                    delay: 8000,
                    addclass: "stack-bar-top",
                    cornerclass: "",
                    stack: stack_topright
                });
            }
        };
    });