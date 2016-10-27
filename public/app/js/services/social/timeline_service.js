'use strict';

angular.module('dendroApp.services')
    .service('timelineService', ['$http', function ($http) {

        this.get_all_posts = function(currentPage)
        {
            var requestUri = "/posts/all";

            return $http({
                method: 'GET',
                url: requestUri,
                contentType: "application/json",
                headers: {'Accept': "application/json"},
                params: {currentPage: currentPage}
            });
        };

        this.get_logged_user = function()
        {
            //TODO Passar isto para o controlador de users (/users/whoami)
            var requestUri = "/posts/loggedUser";

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
        };

        this.getPost_Service = function (postID) {
            var requestUri = "/posts/post";

            var params = {
                postID : postID
            };

            return $http({
                method: 'POST',
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            });
        };

        this.likePost = function(postID)
        {
            var requestUri = "/posts/like";

            var params = {
                postID : postID
            };

            return $http({
                method: 'POST',
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            });
        };

        this.postIsLiked = function(postID)
        {
            var requestUri = "/posts/like/liked";

            var params = {
                postID : postID
            };

            return $http({
                method: 'POST',
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            });
        };

        this.postLikesInfo = function(postURI)
        {
            console.log('HERE1');
            var requestUri = "/posts/post/likesInfo";
            var params = {
                postURI : postURI
            };

            return $http({
                method: 'POST',
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            });
        };

        this.commentPost = function(postID, commentMsg)
        {
            var requestUri = "/posts/comment";

            var params = {
                postID : postID,
                commentMsg: commentMsg
            };

            return $http({
                method: 'POST',
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            });
        }

        this.sharePost = function(postID, shareMsg)
        {
            var requestUri = "/posts/share";

            var params = {
                postID : postID,
                shareMsg: shareMsg
            };

            return $http({
                method: 'POST',
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            });
        }

        this.getCommentsFromPost = function(postID)
        {
            var requestUri = "/posts/comments";

            console.log('postID here is:', postID);

            var params = {
                postID : postID
            };

            return $http({
                method: 'POST',
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {'Accept': "application/json"}
            });
        }

        this.getSharesFromPost = function(postID)
        {
            var requestUri = "/posts/shares";

            console.log('postID here is:', postID);

            var params = {
                postID : postID
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
