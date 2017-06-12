DBPediaLoader = function(db)
{
    const self = this;
    this.db = db;
};

DBPediaLoader.prototype.load_dbpedia = function(callback)
{
	const allQuadsParser = require('./parsing/all_quads_parser.js');
    const path = require('path');
    const self = this;

    allQuadsParser.parseAllFiles(
        self.db,
        //path.dirname(module.parent.parent.filename) + '/kb/loaders/dbpedia/datasets/samples',
        path.dirname(module.parent.parent.filename) + '/kb/loaders/dbpedia/datasets/samples',
            function(err, messages)
            {
                callback(err, messages);
            }
    );
};

module.exports.DBPediaLoader = DBPediaLoader;

