const XMLWriter = require('xml-writer');
const self = this;
const isNull = require('../utils/null.js').isNull;

module.exports.dataToJSON = function (data)
{
    return JSON.stringify(data, null, 4);
};
module.exports.metadataToRDF = function (metadata)
{
    const xw = new XMLWriter();
    xw.startDocument('1.0', 'UTF-8');
    xw.startElementNS('rdf', 'RDF');
    xw.writeAttributeNS('xmlns', 'rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#');

    const namespaces = {};
    const tempXML = self.metadataToRDFRec(metadata, namespaces);

    for (let prop in namespaces)
    {
        xw.writeAttributeNS('xmlns', prop, namespaces[prop]);
    }
    xw.writeRaw(tempXML);

    xw.endElement();
    xw.endDocument();
    return xw.toString();
};
exports.metadataToRDFRec = function (metadata, namespaces)
{
    const xw = new XMLWriter();

    if (!isNull(metadata.title))
    {
        xw.startElementNS('rdf', 'Description').writeAttributeNS('rdf', 'about', metadata.title.toString());
    }
    else
    {
        xw.startElementNS('rdf', 'Description');
    }

    if (!isNull(metadata.descriptors))
    {
        metadata.descriptors.forEach(function (descriptor)
        {
            namespaces[descriptor.prefix] = descriptor.ontology;
            xw.startElementNS(descriptor.prefix, descriptor.shortName);
            xw.text(descriptor.value.toString());
            xw.endElement();
        });
    }

    if (!isNull(metadata.hasLogicalParts) && metadata.hasLogicalParts.length > 0)
    {
        namespaces.nie = 'http://www.semanticdesktop.org/ontologies/2007/01/19/nie#';

        xw.startElementNS('nie', 'hasLogicalPart', 'http://www.semanticdesktop.org/ontologies/2007/01/19/nie#')
            .writeAttributeNS('rdf', 'parseType', 'Collection');

        metadata.hasLogicalParts.forEach(function (logicalPart)
        {
            xw.writeRaw(self.metadataToRDFRec(logicalPart, namespaces));
        });
        xw.endElement();
    }

    xw.endElement();
    return xw.toString();
};
module.exports.metadataToText = function (metadata)
{
    const level = 0;
    const namespaces = {};
    const comments = {};
    const tempText = self.metadataToTextRec(metadata, level, namespaces, comments);

    let namespacesText = '';
    for (var prefix in namespaces)
    {
        namespacesText += prefix + ':' + namespaces[prefix] + '\n';
    }

    let commentsText = '';
    for (var prefix in comments)
    {
        commentsText += prefix + ':' + '\n';
        for (let shortName in comments[prefix])
        {
            if (comments[prefix].hasOwnProperty(shortName))
            {
                commentsText += ' ' + comments[prefix][shortName].label + '(' + shortName + ')' + ': ' + comments[prefix][shortName].comment + '\n';
            }
        }
    }

    return namespacesText + '\n' + tempText + '\n' + commentsText;
};
exports.metadataToTextRec = function (metadata, level, namespaces, comments)
{
    let text = '';

    for (let i = 0; i < level - 1; i++)
    {
        text += ' ' + ' ' + ' ';
    }
    if (level > 0) text += '|' + '-' + '-';

    if (typeof metadata.file_extension !== 'undefined')
    {
        if (metadata.file_extension === 'folder')
        {
            text += './';
        }
        else
        {
            text += '.';
        }
    }
    else
    {
        text += './';
    }

    if (metadata.title !== null)
    {
        text += metadata.title + '\n';
    }
    else
    {
        text += '\n';
    }
    if (typeof metadata.descriptors !== 'undefined')
    {
        metadata.descriptors.forEach(function (descriptor)
        {
            namespaces[descriptor.prefix] = descriptor.ontology;
            if (!(descriptor.prefix in comments))
            {
                comments[descriptor.prefix] = {};
            }

            if (!(descriptor.label in comments[descriptor.prefix]))
            {
                comments[descriptor.prefix][descriptor.shortName] = {};
            }

            comments[descriptor.prefix][descriptor.shortName].comment = descriptor.comment;
            comments[descriptor.prefix][descriptor.shortName].label = descriptor.label;

            for (let j = 0; j < level - 1; j++) text += ' ' + ' ' + ' ';
            if (level > 0)
            {
                text += ' ' + ' ' + ' ';
            }
            text += '|' + ' ' + '+' + descriptor.label + '(' + descriptor.prefixedForm + ')' + ' : ' + descriptor.value.toString() + '\n';
        });

        if (!isNull(metadata.hasLogicalParts) && metadata.hasLogicalParts.length > 0)
        {
            level++;
            metadata.hasLogicalParts.forEach(function (logicalPart)
            {
                text += self.metadataToTextRec(logicalPart, level, namespaces, comments);
            });
        }
    }

    return text;
};
