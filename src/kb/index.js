const rlequire = require("rlequire");

const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const ElasticSearchConnection = rlequire("dendro", "src/kb/indexes/elasticsearch_connection.js").ElasticSearchConnection;
const SearchIndexConnection = rlequire("dendro", "src/kb/indexes/search_index_connection.js").SearchIndexConnection;
const SolrIndexConnection = rlequire("dendro", "src/kb/indexes/solr_index_connection.js").SolrIndexConnection;

if (Config.index.type === "elasticsearch")
{
    module.exports.IndexConnection = ElasticSearchConnection;
}

else if (Config.index.type === "si")
{
    module.exports.IndexConnection = SearchIndexConnection;
}

else if (Config.index.type === "solr")
{
    module.exports.IndexConnection = SolrIndexConnection;
}

else throw new Error("Invalid index type " + Config.index.type);

