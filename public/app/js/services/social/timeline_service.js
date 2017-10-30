'use strict';

angular.module('dendroApp.services')
    .service('timelineService', ['$http', function ($http) {

        this.countNumPosts = function () {
            var requestUri = "/posts/count";

            return $http({
                method: 'GET',
                url: requestUri,
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            });
        };


        this.getPostInfo = function (postUri) {
            return $http({
                method: 'GET',
                url: postUri,
                contentType: "application/json",
                accept: "text/html",
                headers: {'Accept': "application/json"}
            });
        };

        this.getShareInfo = function (shareUri) {
            return $http({
                method: 'GET',
                url: shareUri,
                contentType: "application/json",
                accept: "text/html",
                headers: {'Accept': "application/json"}
            });
        };

        this.get_all_posts = function(currentPage)
        {
            var requestUri = "/posts/all";

            return $http({
                method: 'GET',
                url: requestUri,
                contentType: "application/json",
                headers: {"Accept": "application/json"},
                params: {currentPage: currentPage}
            });
        };

        this.get_logged_user = function()
        {
            var requestUri = "/users/loggedUser";

            return $http({
                method: 'GET',
                url: requestUri,
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            });
        };

        this.newPost = function(newPostTitle, newPostContent, newPostProjectUri)
        {
            var requestUri = "/posts/new";

            var params = {
                newPostContent : newPostContent,
                newPostTitle: newPostTitle,
                newPostProjectUri: newPostProjectUri
            };

            return $http({
                method: "POST",
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            });
        };

        this.getPost_Service = function (postID) {
            var requestUri = "/posts/post";

            var params = {
                postID : postID
            };

            return $http({
                method: "GET",
                url: requestUri,
                params: params,
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            });
        };

        this.getPosts_Service = function (postsQueryInfo) {
            var requestUri = "/posts/posts";

            var params = {
                postsQueryInfo : postsQueryInfo
            };

            return $http({
                method: 'GET',
                url: requestUri,
                params: params,
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
                method: "POST",
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            });
        };

        this.postLikesInfo = function(postURI)
        {
            var requestUri = "/posts/post/likes";
            var params = {
                postURI : postURI
            };

            return $http({
                method: "GET",
                url: requestUri,
                params: params,
                contentType: "application/json",
                headers: {"Accept": "application/json"}
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
                method: "POST",
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            });
        };

        this.sharePost = function(postID, shareMsg)
        {
            var requestUri = "/posts/share";

            var params = {
                postID : postID,
                shareMsg: shareMsg
            };

            return $http({
                method: "POST",
                url: requestUri,
                data: params,
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            });
        };

        this.getCommentsFromPost = function(postID)
        {
            var requestUri = "/posts/comments";

            var params = {
                postID : postID
            };

            return $http({
                method: "GET",
                url: requestUri,
                params: params,
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            });
        };

        this.getSharesFromPost = function(postID)
        {
            var requestUri = "/posts/shares";

            var params = {
                postID : postID
            };

            return $http({
                method: "GET",
                url: requestUri,
                params: params,
                contentType: "application/json",
                headers: {"Accept": "application/json"}
            });
        }

    }]);
