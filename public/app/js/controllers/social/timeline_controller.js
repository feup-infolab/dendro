angular.module('dendroApp.controllers')
    /**
     *  Project administration controller
     */
    .controller('timelineCtrl', function ($scope, $http, $filter, timelineService)
    {

        $scope.posts = [];

        $scope.get_all_posts = function(currentPage)
        {
            $scope.getting_posts = true;

            console.log('at $scope.get_all_posts, currentPage: ', currentPage);
            timelineService.get_all_posts(currentPage)
                .then(function(response)
                {
                    //$scope.posts = response.data;
                    console.log('response.data: ');
                    console.log(response.data);
                    console.log('----Posts Before-----');
                    console.log($scope.posts);
                    //$scope.posts = $scope.posts.concat(response.data);
                    $scope.posts = $scope.posts.concat(response.data);
                    console.log('----Posts After-----');
                    console.log($scope.posts);
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
                    $scope.posting_new_post = false;
                })
                .catch(function(error){
                    console.error("Error creating new post" + JSON.stringify(error));
                    $scope.posting_new_post = false;
                });
        };

        $scope.likePost = function (postID) {
            console.log('postID to like is:', postID);

            $scope.doing_likePost = true;

            timelineService.likePost(postID)
                .then(function(response)
                {
                    $scope.show_popup(response.data.message);

                    //$scope.get_all_posts();
                    $scope.postLikesInfo(postID);
                    $scope.doing_likePost = false;
                })
                .catch(function(error){
                    console.error("Error liking a post" + JSON.stringify(error));
                    $scope.doing_likePost = false;
                });
        };

        $scope.postIsLiked = function (postID) {
            console.log('postID to check like is:', postID);

            $scope.doing_postIsLiked = true;

            timelineService.postIsLiked(postID)
                .then(function(response)
                {
                    console.log('timeLine_controller postIsLiked:', response.data);
                    $scope.show_popup(response.data.message);

                    //$scope.get_all_posts();
                    $scope.doing_postIsLiked = false;
                    //$scope.likedPosts[postID] = response.data;
                    return response.data;
                })
                .catch(function(error){
                    console.error("Error checking like of a post" + JSON.stringify(error));
                    $scope.doing_postIsLiked = false;
                    return false;
                });
        };

        $scope.postLikesInfo = function(postURI) {

            console.log('in postLikesInfo');
            console.log('postURI to get likesInfo: ', postURI);

            $scope.doing_postLikesInfo = true;

            timelineService.postLikesInfo(postURI).then(function (response) {
                console.log('timeline_controller postLikesInfo: ', response.data);
                $scope.doing_postLikesInfo = false;
                $scope.likesPostInfo[postURI] = response.data;
                return response.data;
            }).catch(function (error) {
                console.error("Error at timeline_controller postLikesInfo" + JSON.stringify(error));
                $scope.doing_postIsLiked = false;
                return false;
            });
        };

        $scope.get_logged_user = function () {

            $scope.doing_get_logged_user = true;

            timelineService.get_logged_user()
                .then(function(response)
                {
                    //$scope.show_popup(response.data.message);
                    console.log('the logged user is:', response.data.uri);
                    $scope.loggedUser = response.data.uri;

                    $scope.doing_get_logged_user = false;
                })
                .catch(function(error){
                    console.error("Error getting logged in user" + JSON.stringify(error));
                    $scope.doing_get_logged_user = false;
                });
        };

        $scope.getPost = function (postURI, sharePostURI) {

            $scope.doing_getPost = true;
            $scope.queriedPost = null;

            timelineService.getPost_Service(postURI)
                .then(function(response)
                {
                    //$scope.queriedPost = response.data;
                    if(sharePostURI)
                    {
                        console.log('using for share service');
                        $scope.shareList[sharePostURI] = response.data;
                    }
                    else
                    {
                        console.log('using for post service');
                        $scope.postList[postURI] = response.data;
                    }

                    $scope.doing_getPost = false;
                })
                .catch(function(error){
                    console.error("Error getting a post" + JSON.stringify(error));
                    $scope.doing_getPost = false;
                });
        };

        $scope.commentPost = function (postID, commentMsg) {
            console.log('postID to like is:', postID);
            console.log('commentMsg is:', commentMsg);

            $scope.doing_commentPost = true;

            timelineService.commentPost(postID, commentMsg)
                .then(function(response)
                {
                    $scope.show_popup(response.data.message);

                    //$scope.get_all_posts();
                    $scope.getCommentsFromPost(postID);
                    $scope.doing_commentPost = false;
                })
                .catch(function(error){
                    console.error("Error commenting a post" + JSON.stringify(error));
                    $scope.doing_commentPost = false;
                });
        };

        $scope.sharePost = function (postID, shareMsg) {
            console.log('postID to share is:', postID);
            console.log('shareMsg is:', shareMsg);

            $scope.doing_sharePost = true;

            timelineService.sharePost(postID, shareMsg)
                .then(function(response)
                {
                    $scope.show_popup(response.data.message);

                    $scope.get_all_posts();//TODO remove this function call???
                    $scope.doing_sharePost = false;
                })
                .catch(function(error){
                    console.error("Error sharing a post" + JSON.stringify(error));
                    $scope.doing_sharePost = false;
                });
        };

        $scope.getSharesFromPost = function (postID) {
            console.log('postID to get shares is:', postID);

            $scope.doing_getSharesFromPost = true;

            timelineService.getSharesFromPost(postID)
                .then(function(response)
                {
                    console.log('the response is:');
                    console.log(response.data);
                    $scope.show_popup(response.data);
                    //$scope.commentList = response.data;
                    $scope.shareList[postID] = response.data;
                    $scope.doing_getSharesFromPost = false;
                })
                .catch(function(error){
                    console.error("Error getting shares from a post" + JSON.stringify(error));
                    $scope.doing_getSharesFromPost = false;
                });
        };

        $scope.getCommentsFromPost = function (postID) {
            console.log('postID to get comments is:', postID);

            $scope.doing_getCommentsFromPost = true;

            timelineService.getCommentsFromPost(postID)
                .then(function(response)
                {
                    console.log('the response is:');
                    console.log(response.data);
                    $scope.show_popup(response.data);
                    //$scope.commentList = response.data;
                    $scope.commentList[postID] = response.data;
                    $scope.doing_getCommentsFromPost = false;
                })
                .catch(function(error){
                    console.error("Error getting comments from a post" + JSON.stringify(error));
                    $scope.doing_getCommentsFromPost = false;
                });
        };

        $scope.init = function()
        {
            console.log('NA INIT');
            //$scope.posts = [];//TODO cuidado com isto
            //For pagination purposes
            $scope.currentPage = 1;
            $scope.pageSize = 5;
            $scope.countCenas = 1;

            $scope.new_post_content = "";
            $scope.commentList = [];
            $scope.shareList = [];
            $scope.likedPosts = [];
            $scope.postList = [];
            //$scope.get_all_posts();
            $scope.get_all_posts($scope.currentPage);
            $scope.likesPostInfo = [];
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

        $scope.waitForPostInfo = function (postURI) {
            console.log('in waitForPostInfo');
            var socket = io('http://127.0.0.1:3001');
            socket.on('postURI:'+ postURI, function (postData) {
                console.log('session for: ', postURI);
                console.log('this was the data:');
                console.log(postData);
            });
        };

        $scope.pageChangeHandler = function(num) {
            console.log('posts page changed to ' + num);
            $scope.currentPage = num;
            //$scope.get_all_posts($scope.currentPage);
        };
    });