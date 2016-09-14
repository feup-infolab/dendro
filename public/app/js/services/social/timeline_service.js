'use strict';

angular.module('dendroApp.services')
    .service('timelineService', ['$http', function ($http) {

        this.get_all_posts = function()
        {
            var requestUri = "/posts/all";

            return $http({
                method: 'GET',
                url: requestUri,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            });
        };

        this.new_post = function(new_post_content)
        {
            var requestUri = "/posts/new";

            var params = {
                new_post_content : new_post_content
            };

            return $http({
                method: 'POST',
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            });
        }

    }]);
