var XMLWriter = require('xml-writer');
var self = this;

module.exports.dataToJSON = function(data){

    return JSON.stringify(data,null, 4);
};
module.exports.metadataToRDF = function(metadata){

    var xw = new XMLWriter;
    xw.startDocument('1.0','UTF-8');
    xw.startElementNS('rdf','RDF');
    xw.writeAttributeNS('xmlns','rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#');

    var namespaces = {};
    var tempXML = self.metadataToRDFRec(metadata, namespaces);

    for(var prop in namespaces){
        xw.writeAttributeNS('xmlns',prop, namespaces[prop]);
    }
    xw.writeRaw(tempXML);

    xw.endElement();
    xw.endDocument();
    return xw.toString();
};
exports.metadataToRDFRec = function (metadata,namespaces){
    var xw = new XMLWriter;

    if(metadata.title != null)
        xw.startElementNS('rdf','Description').writeAttributeNS('rdf','about', metadata.title.toString());
    else
        xw.startElementNS('rdf','Description');

    if(metadata.descriptors != null){
        metadata.descriptors.forEach(function(descriptor){
            namespaces[descriptor.prefix] = descriptor.ontology;
            xw.startElementNS(descriptor.prefix, descriptor.shortName);
            xw.text(descriptor.value.toString());
            xw.endElement();
        });
    }

    if(metadata.hasLogicalParts != null && metadata.hasLogicalParts.length > 0)
    {
        namespaces['nie'] = "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#";

        xw.startElementNS("nie", "hasLogicalPart", "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#")
            .writeAttributeNS("rdf", "parseType", "Collection");

        metadata.hasLogicalParts.forEach(function(logicalPart){
            xw.writeRaw(self.metadataToRDFRec(logicalPart, namespaces));
        });
        xw.endElement();
    }

    xw.endElement();
    return xw.toString();
};
module.exports.metadataToText = function(metadata){

    var level = 0;
    var namespaces = {};
    var comments = {};
    var tempText = self.metadataToTextRec(metadata, level,namespaces, comments);

    var namespacesText = "";
    for(var prefix in namespaces){
        namespacesText += prefix + ":" + namespaces[prefix] + "\n";
    }

    var commentsText = "";
    for(var prefix in comments){
        commentsText += prefix + ":" + "\n";
        for(var shortName in comments[prefix])
            commentsText += " " + comments[prefix][shortName]['label']+ "(" + shortName +")" + ": " + comments[prefix][shortName]['comment'] + "\n";
    }

    return namespacesText + "\n" +  tempText + "\n" + commentsText;
};
exports.metadataToTextRec = function(metadata, level, namespaces, comments){
    var text = ""

    for(var i = 0; i< level-1; i++){
        text += " " + " " + " ";
    }
    if(level >0) text+= "|" + "-" + "-";

    if(metadata.file_extension != null){
        if(metadata.file_extension ==  "folder"){
            text += "./";
        } else{
            text += ".";
        }
    }
    else{
       text += "./";
    }

    if(metadata.title !=null)
        text += metadata.title + "\n";
    else
        text+= "\n";
    if(metadata.descriptors!= null){
        metadata.descriptors.forEach(function(descriptor){
            namespaces[descriptor.prefix] = descriptor.ontology;
            if (!(descriptor.prefix in comments)) {
                comments[descriptor.prefix] = {};
            }

            if (!(descriptor.label in comments[descriptor.prefix])) {
                comments[descriptor.prefix][descriptor.shortName] = {};
            }

            comments[descriptor.prefix][descriptor.shortName]['comment'] = descriptor.comment;
            comments[descriptor.prefix][descriptor.shortName]['label'] = descriptor.label;

            for(var j = 0; j< level-1; j++) text += " " + " " + " ";
            if(level >0){
                text+= " " + " " + " "  ;
            }
            text += "|" +" "+ "+" + descriptor.label + "(" + descriptor.prefixedForm +")"+ " : " + descriptor.value.toString() + "\n";
        });

        if(metadata.hasLogicalParts != null && metadata.hasLogicalParts.length > 0){
            level++;
            metadata.hasLogicalParts.forEach(function(logicalPart){
                text += self.metadataToTextRec(logicalPart, level, namespaces,comments);
            });
        }
    }


    return text;
}


