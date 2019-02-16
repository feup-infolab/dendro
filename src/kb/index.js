const rlequire = require("rlequire");

const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const ElasticSearchIndexConnection = rlequire("dendro", "src/kb/index/elasticsearch.js").IndexConnection;
const SolrIndexConnection = rlequire("dendro", "src/kb/index/solr.js").IndexConnection;

if (Config.index.type === "elasticsearch")
{
    module.exports.IndexConnection = ElasticSearchIndexConnection;
}

else if (Config.index.type === "solr")
{
    module.exports.IndexConnection = SolrIndexConnection;
}
else throw new Error("Invalid index type " + Config.index.type);

