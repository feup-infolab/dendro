const rlequire = require("rlequire");

const Config = rlequire("dendro", "src/models/meta/config.js").Config;
if (Config.index.type === "elasticsearch")
{
    const ElasticSearchConnection = rlequire("dendro", "src/kb/indexes/elasticsearch_connection.js").ElasticSearchConnection;
    module.exports.IndexConnection = ElasticSearchConnection;
}

else if (Config.index.type === "si")
{
    const SearchIndexConnection = rlequire("dendro", "src/kb/indexes/search_index_connection.js").SearchIndexConnection;
    module.exports.IndexConnection = SearchIndexConnection;
}

else if (Config.index.type === "solr")
{
    const SolrIndexConnection = rlequire("dendro", "src/kb/indexes/solr_index_connection.js").SolrIndexConnection;
    module.exports.IndexConnection = SolrIndexConnection;
}

else throw new Error("Invalid index type " + Config.index.type);

