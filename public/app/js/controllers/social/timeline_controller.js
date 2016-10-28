angular.module('dendroApp.controllers')
    /**
     *  Project administration controller
     */
    .controller('timelineCtrl', function ($scope, $http, $filter, timelineService)
    {

        $scope.posts = [];
        $scope.countCenas = 1;
        $scope.totalPosts = 0;
        $scope.postsPerPage = 5; // this should match however many results your API puts on one page

        $scope.pagination = {
            current: 1
        };

        $scope.get_all_posts = function(currentPage)
        {
            $scope.getting_posts = true;

            console.log('at $scope.get_all_posts, currentPage: ', $scope.pagination.current);
            timelineService.get_all_posts(currentPage)
                .then(function(response)
                {
                    //$scope.posts = $scope.posts.concat(response.data);
                    //$scope.posts = $scope.posts.concat(response.data);
                    $scope.posts = response.data;
                    //$scope.totalPosts = response.data.length;//AQUI CENAS ALTERACAO
                    console.log('posts are:');
                    console.log($scope.posts);
                    $scope.getting_posts = false;
                    console.log('AQUI DUDE');
                    //$scope.$apply();
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

            $scope.doing_postLikesInfo = true;

            timelineService.postLikesInfo(postURI).then(function (response) {
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
                        //using for share service
                        $scope.shareList[sharePostURI] = response.data;
                    }
                    else
                    {
                        //using for post service
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

                    //$scope.get_all_posts($scope.currentPage);//TODO remove this function call???
                    $scope.get_all_posts($scope.pagination.current);//TODO remove this function call???
                    $scope.doing_sharePost = false;
                })
                .catch(function(error){
                    console.error("Error sharing a post" + JSON.stringify(error));
                    $scope.doing_sharePost = false;
                });
        };

        $scope.getSharesFromPost = function (postID) {

            $scope.doing_getSharesFromPost = true;

            timelineService.getSharesFromPost(postID)
                .then(function(response)
                {
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

            $scope.doing_getCommentsFromPost = true;

            timelineService.getCommentsFromPost(postID)
                .then(function(response)
                {
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
            /*$scope.currentPage = 1;
            $scope.pageSize = 5;
            $scope.numPosts = 0;*/

            $scope.new_post_content = "";
            $scope.commentList = [];
            $scope.shareList = [];
            $scope.likedPosts = [];
            $scope.postList = [];
            //$scope.get_all_posts();
            $scope.countNumPosts();
            //$scope.get_all_posts($scope.currentPage);
            $scope.get_all_posts($scope.pagination.current);
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

        $scope.countNumPosts = function () {

            timelineService.countNumPosts()
                .then(function(response)
                {
                    //$scope.numPosts = response.data;
                    //console.log('$scope.numPosts: ', $scope.numPosts);
                    $scope.totalPosts = response.data;
                    console.log('$scope.totalPosts: ', $scope.totalPosts);
                })
                .catch(function(error){
                    console.error("Error number of posts" + JSON.stringify(error));
                });
        };

        $scope.pageChangeHandler = function(num) {
            console.log('posts page changed to ' + num);
            console.log('Posts.length: ', $scope.posts.length);
            //$scope.currentPage = num;
            $scope.countCenas = num;
            console.log('countCenas aqui: ', $scope.countCenas);
            //$scope.posts = [];
            //$scope.$apply();
            //$scope.get_all_posts($scope.currentPage);
            $scope.get_all_posts(num);
        };
    });