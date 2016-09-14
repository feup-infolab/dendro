var query =
    "SELECT * \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "{ \n" +
        " ?uri ddr:handle ?handle . \n" +
        " ?uri dcterms:creator [1] .\n"+
        " ?uri dcterms:title ?title .\n"+
        " ?uri dcterms:description ?description . \n" +
        " ?uri dcterms:subject ?subject . \n" +
        "} \n" +
        " UNION \n" +
        "{ \n" +
        " ?uri ddr:handle ?handle . \n" +
        " ?uri dcterms:contributor [1] .\n"+
        " ?uri dcterms:title ?title .\n"+
        " ?uri dcterms:description ?description . \n" +
        " ?uri dcterms:subject ?subject . \n" +
        "} \n"+
        "} \n";

db.connection.execute(query,
    [
        {
            type : DbConnection.resourceNoEscape,
            value : db.graphUri
        },
        {
            type : DbConnection.resource,
            value : creatorOrContributor
        }
    ],
    function(err, rows) {
        if(!err)
        {
            if(rows instanceof Array)
            {
                var projectsToReturn = [];
                var coveredProjects = [];

                for(var i = 0; i < rows.length; i++)
                {
                    var row = rows[i];

                    if(coveredProjects[row.uri] == null)
                    {
                        var aProject = new Project(row);
                        aProject.contributors = [];
                        coveredProjects[row.uri] = aProject;
                    }

                    if(row.contributor != null)
                    {
                        coveredProjects[row.uri].contributors.push(row.contributor);
                    }

                    if(row.creator != null)
                    {
                        coveredProjects[row.uri].creator = creatorOrContributor;
                    }
                }

                for (var property in coveredProjects) {
                    if (coveredProjects.hasOwnProperty(property)) {
                        projectsToReturn.push(coveredProjects[property]);
                    }
                }

                callback(null, projectsToReturn);
            }
            else
            {
                //project does not exist, return null
                callback(0, null);
            }
        }
        else
        {
            //project var will contain an error message instead of a single-element
            // array containing project data.
            callback(err, [rows]);
        }
    });

Resource.prototype.replaceDescriptorsInMemory = function(descriptors)
{
    var self = this;

    //set only the descriptors sent as argument
    for(var i = 0; i < descriptors.length; i++)
    {
        var descriptor = descriptors[i];
        if(descriptor.prefix != null && descriptor.shortName != null)
        {
            var newValue = null;
            var oldValue = self[descriptor.prefix][descriptor.shortName];

            if(oldValue instanceof Array)
            {
                if(descriptor.value instanceof Array)
                {
                    newValue = _.uniq(_.union(oldValue, descriptor.value));
                }
                else if(descriptor.value != null)
                {
                    newValue = descriptor.value;
                }
            }
            else if(oldValue != null)
            {
                if(descriptor.value instanceof Array)
                {
                    newValue = _.uniq(_.union([oldValue], descriptor.value));
                }
                else if(descriptor.value != null)
                {
                    newValue = descriptor.value;
                }
            }
            else
            {
                newValue = descriptor.value;
            }

            if(newValue != null)
            {
                self[descriptor.prefix][descriptor.shortName] = newValue;
            }
            else
            {
                delete self[descriptor.prefix][descriptor.shortName];
            }
        }
        else
        {
            var error = "Descriptor " + util.inspect(descriptor) + " does not have a prefix and a short name.";
            console.error(error);
        }
    }

    return self;
};

/*
DELETE ALL bookmarks

WITH GRAPH  <http://127.0.0.1:3001/dendro_graph>
DELETE
WHERE
{
?s rdf:type ddr:ExternalRepository.
?s ?p ?o
}
 */


