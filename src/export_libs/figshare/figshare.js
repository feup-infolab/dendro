/**
 * Created by Filipe on 09/07/2014.
 */

var request = require('request');

FigShare.apiURL = 'http://api.figshare.com';
FigShare.requestTokenURL = FigShare.apiURL + '/v1/pbl/oauth/request_token';
FigShare.accessTokenURL = FigShare.apiURL + '/v1/pbl/oauth/access_token';
FigShare.authorizeURL = FigShare.apiURL + '/v1/pbl/oauth/authorize';
FigShare.articlesURL = FigShare.apiURL + '/v1/my_data/articles';
FigShare.filesURL = '/files';


function FigShare(accessCodes){
    this.oauth = {};
    if(accessCodes.consumer_key == null ||accessCodes.consumer_secret  == null || accessCodes.access_token == null || accessCodes.access_token_secret == null ){
        throw "Invalid oauth access codes";
    }
    else{
        this.oauth.consumer_key = accessCodes.consumer_key;
        this.oauth.consumer_secret = accessCodes.consumer_secret;
        this.oauth.token = accessCodes.access_token;
        this.oauth.token_secret = accessCodes.access_token_secret;
    }
};
FigShare.prototype.getArticles = function(callback){

    request.get({
            url:FigShare.articlesURL,
            oauth:this.oauth,
            json:true
        },
        function (e, r, data) {
            if(e){
                console.log(e);
                callback(true);
            }
            else{
                callback(false);
            }
        })
};
FigShare.prototype.createArticle = function(article_data, callback){

    request.post({
            url :FigShare.articlesURL,
            body: {
                title: article_data.title || "no_title_available",
                description:article_data.description || "no_description_available",
                defined_type :'fileset'
            },
            oauth:this.oauth,
            json:true
        },
        function (e, r, article) {
            if(e){
                console.log(e);
                callback(true);
            }
            else{
                callback(false,article);
            }
        })
};
FigShare.prototype.deleteArticle = function(articleID, callback){
    request.del({
            url :FigShare.articlesURL + '/' +articleID,
            oauth:this.oauth,
            json:true
        },
        function (e, r, data) {
            if(e){
                console.log(e);
                callback(true);
            }
            else{
                callback(false);
            }
        })
};
FigShare.prototype.addFileToArticle = function(articleID, file,callback){

    var fs = require('fs');
    var r = request.put({
            url :FigShare.articlesURL + '/' + articleID + FigShare.filesURL,
            oauth:this.oauth,
            json:true
        },
        function (e, r, data) {
            if(e){
                console.log(e);
                callback(true);
            }
            else{
                callback(false);
            }
        });

    var form = r.form();
    form.append('filedata',fs.createReadStream(file));
};

FigShare.prototype.addMultipleFilesToArticle = function(articleID, files, callback){

    var self = this;
    var async = require('async');

    async.each(files, function(file, callback){
            self.addFileToArticle(articleID, file,function(err){
                if(err)
                {
                    callback(true);
                }
                else callback(false);
            })
        },
        function(err){
            if(err){
                callback(true);
            }
            else{
                callback(false);
            }
        })
};

module.exports  = FigShare;