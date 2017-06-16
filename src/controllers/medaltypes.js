var Config = require('../models/meta/config.js').Config;

var MedalType = require(Config.absPathInSrcFolder("/models/game/medal_type.js")).MedalType;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;

var db = function() { return GLOBAL.db.default; }();
var gfs = function() { return GLOBAL.gfs.default; }();

var async = require('async');
var _ = require('underscore');

exports.all = function(req, res){

    var viewVars = {
        title : 'Medaltypes'
    };

    viewVars = DbConnection.paginate(req,
        viewVars
    );

    MedalType.all(function(err, medaltypes)
    {
        if(!err)
        {
            viewVars.medaltypes = medaltypes;

            res.render('medaltypes/all',
                viewVars
            );
        }
        else
        {
            viewVars.error_messages = [medaltypes];
            res.render('medaltypes/all',
                viewVars
            );
        }
    });
};