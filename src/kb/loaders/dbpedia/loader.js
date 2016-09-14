DBPediaLoader = function(db)
{
    var self = this;
    this.db = db;
}

DBPediaLoader.prototype.load_dbpedia = function(callback)
{
	var allQuadsParser = require('./parsing/all_quads_parser.js');
    var path = require('path');
    var self = this;

    allQuadsParser.parseAllFiles(
        self.db,
        //path.dirname(module.parent.parent.filename) + '/kb/loaders/dbpedia/datasets/samples',
        path.dirname(module.parent.parent.filename) + '/kb/loaders/dbpedia/datasets/samples',
            function(err, messages)
            {
                callback(err, messages);
            }
    );
}

module.exports.DBPediaLoader = DBPediaLoader;

