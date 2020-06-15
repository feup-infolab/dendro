const validUrl = require("valid-url");
const rlequire = require("rlequire");
const Controls = rlequire("dendro", "src/models/meta/controls.js").Controls;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

function Elements ()
{
}

/** Types of descriptors (manages visibility of certain types of triples to the outside world. Used in elements.js to parametrize the visibility of data in certain conditions) **/
Elements.access_types = {
    public: "public", // can be shared, read and written
    private: "private", // cannot be shared to the outside world under any circumstance
    locked: "locked", // can not be seen or edited from the main interface or via apis
    restorable: "restorable", // can be restorable from a metadata.json file in a zip backup file
    backuppable: "backuppable", // will be included in a metadata.json file produced in a zip file (backup zips)
    audit: "audit", // cannot be changed via API calls, changed internally only
    api_readable: "api_readable", // accessible to the outside world via API calls
    api_writeable: "api_writeable", // modifiable from the outside world via API calls
    immutable: "immutable", // cannot be changed under ANY circumstance
    unrevertable: "unrevertable", // cannot be fallen back in the a "restore previous version" operation
    locked_for_projects: "locked_for_projects", // project metadata which cannot be modified using the metadata editor, has to go through the project administrator
    append_prefix_dendro_baseuri: "append_prefix_dedro_baseuri" // project attributes that need to append dendro uri when exporting to RDF
};

Elements.types = {};
Elements.types.resourceNoEscape = 0;
Elements.types.resource = 1;
Elements.types.property = 2;

Elements.types.string = 3;
Elements.types.int = 4;
Elements.types.double = 5;
Elements.types.boolean = 6;
Elements.types.prefixedResource = 7; // for "dcterms:creator", "nie:isLogicalPartOf" and other prefixed resources
Elements.types.date = 8;
Elements.types.long_string = 9;
Elements.types.stringNoEscape = 10;

Elements.ontologies = {};

Elements.checkIfValidPrefixedResource = function (candidatePrefixedResource)
{
    return RegExp("^[a-zA-Z0-9]+:[a-zA-Z0-9]+$").exec(candidatePrefixedResource);
};

Elements.getInvalidTypeErrorMessageForDescriptor = function (currentDescriptor)
{
    let errorMessagesForTypes = {};
    const msgStart = "Error: The value type for the descriptor " + currentDescriptor.prefix + ":" + "(" + currentDescriptor.label + ")" + " should be ";
    errorMessagesForTypes[Elements.types.resourceNoEscape] = msgStart + "an 'URI'";
    errorMessagesForTypes[Elements.types.resource] = msgStart + "an 'URI'";
    errorMessagesForTypes[Elements.types.property] = msgStart + "an 'URI'";
    errorMessagesForTypes[Elements.types.string] = msgStart + "a 'String'";
    errorMessagesForTypes[Elements.types.int] = msgStart + "an 'Integer'";
    errorMessagesForTypes[Elements.types.double] = msgStart + "a 'Double'";
    errorMessagesForTypes[Elements.types.boolean] = msgStart + "a 'Boolean'";
    errorMessagesForTypes[Elements.types.prefixedResource] = msgStart + "a valid prefixed resource (ex: rdf:type)";
    errorMessagesForTypes[Elements.types.date] = msgStart + "a valid date";
    errorMessagesForTypes[Elements.types.long_string] = msgStart + "a 'String'";
    errorMessagesForTypes[Elements.types.stringNoEscape] = msgStart + "a 'String'";

    return errorMessagesForTypes[currentDescriptor.type];
};

Elements.validateADescriptorValueAgainstItsType = function (descriptorType, descriptorValue)
{
    let typesValidators = {};
    typesValidators[Elements.types.resourceNoEscape] = ((typeof descriptorValue === "string" || descriptorValue instanceof String) && validUrl.is_uri(descriptorValue));
    typesValidators[Elements.types.resource] = ((typeof descriptorValue === "string" || descriptorValue instanceof String) && validUrl.is_uri(descriptorValue));
    typesValidators[Elements.types.property] = ((typeof descriptorValue === "string" || descriptorValue instanceof String) && validUrl.is_uri(descriptorValue));
    typesValidators[Elements.types.string] = (typeof descriptorValue === "string" || descriptorValue instanceof String);
    typesValidators[Elements.types.int] = Number.isInteger(descriptorValue);
    typesValidators[Elements.types.double] = !isNaN(descriptorValue);
    typesValidators[Elements.types.boolean] = (descriptorValue === "true" || descriptorValue === "false" || descriptorValue === true || descriptorValue === false);
    typesValidators[Elements.types.prefixedResource] = Elements.checkIfValidPrefixedResource(descriptorValue);
    typesValidators[Elements.types.date] = !isNaN(Date.parse(descriptorValue));
    typesValidators[Elements.types.long_string] = (typeof descriptorValue === "string" || descriptorValue instanceof String);
    typesValidators[Elements.types.stringNoEscape] = (typeof descriptorValue === "string" || descriptorValue instanceof String);

    return typesValidators[descriptorType];
};

Elements.validateDescriptorValueTypes = function (currentDescriptor)
{
    const Config = rlequire("dendro", "src/models/meta/config.js").Config;

    if (Config.skipDescriptorValuesValidation === true)
    {
        Logger.log("debug", "Will skip validateDescriptorValueTypes because skipDescriptorValuesValidation is set to true in deployment_configs");
        return true;
    }

    // When there are various instances of a descriptor, for example: two dcterms:contributor
    if (currentDescriptor.value instanceof Array)
    {
        for (let i = 0; i !== currentDescriptor.value.length; i++)
        {
            let resultOfValidation = Elements.validateADescriptorValueAgainstItsType(currentDescriptor.type, currentDescriptor.value[i]);
            if (isNull(resultOfValidation) || resultOfValidation === false)
            {
                return false;
            }
        }
    }
    else
    {
        // When there is only one instance of a descriptor (for example only one dcterms:abstract)
        return Elements.validateADescriptorValueAgainstItsType(currentDescriptor.type, currentDescriptor.value);
    }
    return true;

    // OLD CODE -> before adding the Config.skipDescriptorValuesValidation to the deployment_configs
    /*
    // When there are various instances of a descriptor, for example: two dcterms:contributor
    if (currentDescriptor.value instanceof Array)
    {
        for (let i = 0; i !== currentDescriptor.value.length; i++)
        {
            let resultOfValidation = Elements.validateADescriptorValueAgainstItsType(currentDescriptor.type, currentDescriptor.value[i]);
            if (isNull(resultOfValidation) || resultOfValidation === false)
            {
                return false;
            }
        }
    }
    else
    {
        // When there is only one instance of a descriptor (for example only one dcterms:abstract)
        return Elements.validateADescriptorValueAgainstItsType(currentDescriptor.type, currentDescriptor.value);
    }
    return true;*/
};

Elements.validationFunctions = {
    stringOrResourceNoEscape: function (value)
    {
        return Elements.validateADescriptorValueAgainstItsType(Elements.types.string, value) || Elements.validateADescriptorValueAgainstItsType(Elements.types.resourceNoEscape, value);
    }
};

/**
 * Elements of the schema.org Ontology
 */

Elements.ontologies.schema = {
    sharedContent:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            api_readable: true
        },
    provider:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            api_readable: true
        },
    telephone:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            api_readable: true
        },
    address:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            api_readable: true
        },
    license:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            api_readable: true
        },
    email:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            api_readable: true
        }
};

/**
 * Elements of the DC Ontology
 */

Elements.ontologies.dcterms =
    {
        abstract:
            {
                type: Elements.types.string,
                control: Controls.markdown_box
            },
        accessRights:
            {
                type: Elements.types.string,
                control: Controls.input_box

            },
        accrualMethod:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        accrualPeriodicity:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        accrualPolicy:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        alternative:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        audience:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        available:
            {
                type: Elements.types.date,
                control: Controls.date_picker
            },
        bibliographicCitation:
            {
                type: Elements.types.string,
                control: Controls.markdown_box
            },
        conformsTo:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        contributor:
            {
                type: Elements.types.string,
                control: Controls.url_box,
                locked_for_projects: true
            },
        coverage:
            {
                type: Elements.types.string,
                control: Controls.map
            },
        created:
            {
                type: Elements.types.date,
                control: Controls.date_picker
            },
        creator:
            {
                type: Elements.types.string,
                validationFunction: Elements.validationFunctions.stringOrResourceNoEscape,
                control: Controls.url_box,
                locked_for_projects: true,
                append_prefix_dendro_baseuri: true
            },
        date:
            {
                type: Elements.types.date,
                control: Controls.date_picker
            },
        dateAccepted:
            {
                type: Elements.types.date,
                control: Controls.date_picker
            },
        dateCopyrighted:
            {
                type: Elements.types.date,
                control: Controls.date_picker
            },
        dateSubmitted:
            {
                type: Elements.types.date,
                control: Controls.date_picker
            },
        description:
            {
                type: Elements.types.string,
                control: Controls.markdown_box
            },
        educationLevel:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        extent:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        format:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        identifier:
            {
                type: Elements.types.string,
                control: Controls.url_box
            },
        instructionalMethod:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        issued:
            {
                type: Elements.types.date,
                control: Controls.date_picker
            },
        language:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        license:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        mediator:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        medium:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        modified:
            {
                type: Elements.types.date,
                control: Controls.date_picker
            },
        provenance:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        publisher:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        references:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        relation:
            {
                type: Elements.types.string,
                control: Controls.markdown_box
            },
        replaces:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        requires:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        rights:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        rightsHolder:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        source:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        spatial:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        subject:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        SizeOrDuration:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        tableOfContents:
            {
                type: Elements.types.string,
                control: Controls.markdown_box
            },
        temporal:
            {
                type: Elements.types.date,
                control: Controls.input_box
            },
        type:
            {
                type: Elements.types.string,
                control: Controls.markdown_box
            },
        title:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        hasVersion:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        hasPart:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        isPartOf:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        hasFormat: {
            type: Elements.types.string,
            control: Controls.input_box
        },
        isFormatOf:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        isReferencedBy:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        isReplacedBy:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        isRequiredBy:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        isVersionOf:
            {
                type: Elements.types.string,
                control: Controls.url_box
            },
        valid:
            {
                type: Elements.types.string,
                control: Controls.input_box
            }
    };

/**
 * Elements of the FOAF ontology
 */

Elements.ontologies.foaf =
    {
        mbox: {
            type: Elements.types.string,
            control: Controls.input_box
        },
        firstName:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        surname:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        affiliation:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        account:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        accountName:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        accountServiceHomepage:
            {
                type: Elements.types.resource,
                control: Controls.input_box
            },
        age:
            {
                type: Elements.types.int,
                control: Controls.input_box
            },
        aimChatID:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        based_near:
            {
                type: Elements.types.string,
                control: Controls.map
            },
        birthday:
            {
                type: Elements.types.date,
                control: Controls.date_picker
            },
        currentProject:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        depiction:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        depicts:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        dnaChecksum:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        familyName:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        focus:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        fundedBy:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        geekcode:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        gender:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        givenName:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        holdsAccount:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        homepage:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        icqChatID:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        img:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        interest:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        jabberID:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        knows:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        lastName:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        logo:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        made:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        maker:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        mbox_sha1sum:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        member:
            {
                type: Elements.types.string,
                control: Controls.url_box
            },
        membershipClass:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        msnChatID:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        name:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        nick:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        openid:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        page:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        pastProject:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        phone:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        plan:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        primaryTopic:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        publications:
            {
                type: Elements.types.string,
                control: Controls.url_box
            },
        schoolHomepage:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        sha1:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        skypeID:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        status:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        theme:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        tipjar:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        title:
            {
                type: Elements.types.string,
                control: Controls.input_box,
                backuppable: true,
                restorable: true
            },
        topic:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        topic_interest:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        weblog:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        workInfoHomepage:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        workplaceHomepage:
            {
                type: Elements.types.resource,
                control: Controls.url_box
            },
        yahooChatID:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        family_name:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        givenname:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        isPrimaryTopicOf:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        myersBriggs:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        thumbnail:
            {
                type: Elements.types.string,
                control: Controls.input_box
            }
    };

/**
 * Dendro Ontology types
 */

Elements.ontologies.ddr = {
    isAdmin: {
        type: Elements.types.boolean,
        control: Controls.input_box,
        api_readable: true,
        locked: true,
        private: true
    },
    userAccepted: {
        type: Elements.types.boolean,
        control: Controls.input_box,
        private: true,
        locked: true
    },
    acceptingUser: {
        type: Elements.types.resource,
        control: Controls.input_box,
        private: true,
        locked: true
    },
    dataset: {
        type: Elements.types.resource,
        control: Controls.input_box,
        private: true,
        locked: true
    },
    dateOfAcceptance: {
        type: Elements.types.date,
        control: Controls.date_picker,
        private: true,
        locked: true
    },
    requestDate: {
        type: Elements.types.date,
        control: Controls.date_picker,
        private: true,
        locked: true
    },
    accessTerms: {
        type: Elements.types.string,
        control: Controls.markdown_box,
        private: true,
        locked: true
    },
    embargoedDate:
        {
            type: Elements.types.date,
            control: Controls.date_picker,
            private: true,
            locked: true
        },
    proposedCitation:
        {
            type: Elements.types.string,
            control: Controls.markdown_box,
            locked: true

        },
    DOI:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    taskID:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            api_readable: true
        },
    hasErrors:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            api_readable: true
        },
    hasStorageConfig:
        {
            type: Elements.types.string,
            private: true,
            locked: true
        },
    hasStorageType:
        {
            type: Elements.types.string,
            private: true,
            locked: true
        },
    handlesStorageForProject:
        {
            type: Elements.types.resource,
            private: true,
            locked: true
        },
    host:
        {
            type: Elements.types.string,
            private: true,
            locked: true
        },
    port:
        {
            type: Elements.types.int,
            private: true,
            locked: true
        },
    collectionName:
        {
            type: Elements.types.string,
            private: true,
            locked: true
        },
    hasStorageLimit:
        {
            type: Elements.types.int,
            control: Controls.input_box,
            api_readable: true,
            locked: true
        },
    requiresVerifiedUploads:
        {
            type: Elements.types.boolean,
            control: Controls.input_box,
            api_readable: true,
            locked: true
        },
    created:
        {
            type: Elements.types.date,
            control: Controls.date_picker,
            api_readable: true,
            locked: true,
            audit: true
        },
    modified:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            private: true,
            locked: true,
            api_readable: true,
            audit: true
        },
    humanReadableURI: {
        type: Elements.types.string,
        control: Controls.input_box,
        private: true,
        locked: true,
        api_readable: true,
        append_prefix_dendro_baseuri: true
    },
    handle: {
        type: Elements.types.string,
        control: Controls.input_box,
        locked_for_projects: true
    },
    password:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            private: true,
            locked: true
        },
    password_reset_token:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            private: true,
            locked: true
        },
    text_content:
        {
            type: Elements.types.long_string,
            control: Controls.markdown_box
        },
    username:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            api_readable: true,
            locked: true
        },
    hasAvatar:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            api_readable: true
        },
    contentType:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    chunkSize:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    projectUri:
        {
            type: Elements.types.resource,
            api_readable: true,
            control: Controls.url_box
        },
    authorUri:
        {
            type: Elements.types.resource,
            api_readable: true,
            control: Controls.url_box
        },
    resourceAuthorUri:
        {
            type: Elements.types.resource,
            api_readable: true,
            control: Controls.url_box
        },
    userWhoActed:
        {
            type: Elements.types.resource,
            api_readable: true,
            control: Controls.url_box
        },
    resourceTargetUri:
        {
            type: Elements.types.resource,
            api_readable: true,
            control: Controls.url_box
        },
    actionType:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    itemType:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    creatorUri:
        {
            type: Elements.types.resource,
            api_readable: true,
            control: Controls.url_box
        },
    fileExtension:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            backuppable: true,
            restorable: true,
            locked: true
        },
    lastHarvested:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    md5Checksum:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    sourceRepository:
        {
            type: Elements.types.string,
            control: Controls.url_box
        },
    rootFolder:
        {
            type: Elements.types.resource,
            control: Controls.url_box,
            locked: true,
            append_prefix_dendro_baseuri: true
        },
    checksum:
        {
            type: Elements.types.string,
            backuppable: true,
            control: Controls.input_box
        },
    isVersionOf:
        {
            type: Elements.types.resource,
            api_readable: true,
            audit: true,
            control: Controls.url_box
        },
    versionCreator:
        {
            type: Elements.types.resource,
            api_readable: true,
            audit: true,
            control: Controls.url_box
        },
    versionNumber:
        {
            type: Elements.types.int,
            api_readable: true,
            audit: true,
            control: Controls.input_box
        },
    changedDescriptor:
        {
            type: Elements.types.property,
            control: Controls.url_box
        },
    oldValue:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    newValue:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    changeType:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    pertainsTo:
        {
            type: Elements.types.resource,
            control: Controls.url_box
        },
    changeIndex:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    deleted:
        {
            type: Elements.types.boolean,
            backuppable: true,
            api_readable: true,
            control: Controls.input_box
        },
    performedBy:
        {
            type: Elements.types.resource,
            api_readable: true,
            control: Controls.url_box
        },
    interactionType:
        {
            type: Elements.types.string,
            api_readable: true,
            control: Controls.input_box
        },
    executedOver:
        {
            type: Elements.types.resource,
            api_readable: true,
            control: Controls.url_box
        },
    originallyRecommendedFor:
        {
            type: Elements.types.resource,
            api_readable: true,
            control: Controls.url_box
        },
    hasPlatform:
        {
            type: Elements.types.resource,
            api_readable: true,
            control: Controls.url_box
        },
    hasExternalUri:
        {
            type: Elements.types.resource,
            api_readable: true,
            control: Controls.url_box
        },
    hasAPIKey:
        {
            type: Elements.types.string,
            api_readable: true,
            control: Controls.input_box
        },
    hasOrganization:
        {
            type: Elements.types.resource,
            api_readable: true,
            control: Controls.url_box
        },
    hasSwordCollectionUri:
        {
            type: Elements.types.string,
            api_readable: true,
            control: Controls.url_box
        },
    hasSwordCollectionLabel:
        {
            type: Elements.types.string,
            api_readable: true,
            control: Controls.input_box
        },
    hasConsumerKey:
        {
            type: Elements.types.string,
            api_readable: true,
            control: Controls.input_box
        },
    hasConsumerSecret:
        {
            type: Elements.types.string,
            api_readable: true,
            control: Controls.input_box
        },
    hasAccessToken:
        {
            type: Elements.types.string,
            api_readable: true,
            control: Controls.input_box
        },
    hasAccessTokenSecret:
        {
            type: Elements.types.string,
            api_readable: true,
            control: Controls.input_box
        },
    // uncategorized descriptor (for when researcheers dont know which descriptor to select)
    generic:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            api_readable: true
        },
    rankingPosition:
        {
            type: Elements.types.int,
            api_readable: true,
            control: Controls.input_box
        },
    lastDescriptorRecommendationsList:
        {
            type: Elements.types.long_string,
            control: Controls.markdown_box
        },
    hasPrefix:
        {
            type: Elements.types.string,
            api_readable: true,
            control: Controls.input_box
        },
    hasResearchDomain:
        {
            type: Elements.types.string,
            api_readable: true,
            control: Controls.input_box

        },
    metadataQuality:
        {
            type: Elements.types.int,
            api_readable: true,
            locked: true,
            control: Controls.input_box
        },
    privacyStatus:
        {
            type: Elements.types.string,
            api_readable: true,
            control: Controls.input_box,
            locked_for_project: true,
            locked: true
        },
    hasContent:
        {
            type: Elements.types.string,
            api_readable: true,
            control: Controls.input_box
        },
    exportedAt:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            locked: true
        },
    numLikes:
        {
            type: Elements.types.int,
            api_readable: true,
            control: Controls.input_box
        },
    userWhoLiked:
        {
            type: Elements.types.resource,
            control: Controls.url_box,
            locked_for_projects: true
        },
    postURI:
        {
            type: Elements.types.resource,
            control: Controls.url_box,
            locked_for_projects: true
        },
    fileVersionUri:
        {
            type: Elements.types.resource,
            control: Controls.url_box,
            locked_for_projects: true
        },
    userWhoCommented:
        {
            type: Elements.types.resource,
            control: Controls.url_box,
            locked_for_projects: true
        },
    commentMsg:
        {
            type: Elements.types.string,
            api_readable: true,
            control: Controls.input_box
        },
    shareMsg:
        {
            type: Elements.types.string,
            api_readable: true,
            control: Controls.input_box
        },
    shareURI:
        {
            type: Elements.types.resource,
            control: Controls.url_box,
            locked_for_projects: true
        },
    userWhoShared:
        {
            type: Elements.types.resource,
            control: Controls.url_box,
            locked_for_projects: true
        },
    usersWhoLiked:
        {
            type: Elements.types.string,
            control: Controls.url_box,
            locked_for_projects: true
        },
    beingBackedUp:
        {
            type: Elements.types.boolean,
            api_readable: true,
            locked: true,
            control: Controls.input_box
        },
    salt:
        {
            type: Elements.types.string,
            locked: true,
            private: true,
            control: Controls.input_box
        },
    hasFontAwesomeClass:
        {
            type: Elements.types.string,
            locked: true,
            private: true,
            control: Controls.input_box,
            api_readable: true
        },
    pageNumber:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    recommendationCallId:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    recommendationCallTimeStamp:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    orcid:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            private: true,
            locked: true
        },
    hasDataContent:
        {
            type: Elements.types.boolean,
            control: Controls.input_box,
            locked: true,
            api_readable: true
        },
    processingData:
        {
            type: Elements.types.boolean,
            control: Controls.input_box,
            locked: true,
            api_readable: true
        },
    hasDataProcessingError:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            locked: true,
            api_readable: true
        },
    is_being_imported:
        {
            type: Elements.types.boolean,
            control: Controls.input_box,
            locked: true,
            api_readable: true
        },
    exportedFromProject:
        {
            type: Elements.types.resource,
            control: Controls.url_box,
            locked_for_projects: true
        },
    exportedResource:
        {
            type: Elements.types.resource,
            control: Controls.url_box,
            locked_for_projects: true
        },
    exportedFromFolder:
        {
            type: Elements.types.resource,
            control: Controls.url_box,
            locked_for_projects: true
        },
    exportedToRepository:
        {
            type: Elements.types.string,
            api_readable: true,
            control: Controls.url_box
        },
    exportedToPlatform:
        {
            type: Elements.types.string,
            locked: true,
            control: Controls.input_box
        },
    isAvailable:
        {
            type: Elements.types.boolean,
            locked: true,
            control: Controls.input_box
        },
    lastVerifiedDate:
        {
            type: Elements.types.string,
            locked: true,
            control: Controls.input_box
        },
    absoluteUri:
        {
            type: Elements.types.string,
            locked: true,
            private: true,
            control: Controls.input_box
        },
    runningPath: {
        type: Elements.types.string,
        control: Controls.input_box,
        locked: true,
        private: true
    },
    dataFolderPath: {
        type: Elements.types.string,
        control: Controls.input_box,
        locked: true,
        private: true
    },
    notebookID:
        {
            type: Elements.types.string,
            private: true,
            locked: true
        }
};

/**
 * RDF Ontology types
 */

Elements.ontologies.rdf = {
    first:
        {
            type: Elements.types.resource,
            control: Controls.input_box
        },
    object:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    predicate:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    rest:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    subject:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    type:
        {
            type: Elements.types.prefixedResource,
            locked: true,
            api_readable: true,
            control: Controls.input_box
        },
    value:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    isShare:
        {
            type: Elements.types.boolean,
            control: Controls.input_box
        }
};

/**
 * Nepomuk Information Element Ontology
 * http://www.semanticdesktop.org/ontologies/nie/
 */
Elements.ontologies.nie = {
    byteSize:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    characterSet:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    comment:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    contentCreated:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    contentLastModified:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    contentSize:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    copyright:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    created:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    dataSource:
        {
            type: Elements.types.resource,
            control: Controls.url_box
        },
    depends:
        {
            type: Elements.types.resource,
            control: Controls.url_box
        },
    description:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    disclaimer:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    generator:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    generatorOption:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    hasLogicalPart:
        {
            type: Elements.types.resource,
            control: Controls.url_box,
            backuppable: true,
            locked: true,
            api_readable: true,
            append_prefix_dendro_baseuri: true
        },
    hasPart:
        {
            type: Elements.types.resource,
            control: Controls.url_box
        },
    identifier:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    informationElementDate:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    interpretedAs:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    isLogicalPartOf:
        {
            control: Controls.url_box,
            type: Elements.types.resource,
            backuppable: true,
            locked: true,
            api_readable: true,
            append_prefix_dendro_baseuri: true
        },
    isPartOf:
        {
            control: Controls.url_box,
            type: Elements.types.resource,
            backuppable: true,
            locked: true
        },
    isStoredAs:
        {
            control: Controls.input_box,
            type: Elements.types.string
        },
    keyword:
        {
            control: Controls.input_box,
            type: Elements.types.string
        },
    language:
        {
            control: Controls.input_box,
            type: Elements.types.string
        },
    lastRefreshed:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    legal:
        {
            control: Controls.input_box,
            type: Elements.types.string
        },
    license:
        {
            control: Controls.markdown_box,
            type: Elements.types.string
        },
    licenseType:
        {
            control: Controls.input_box,
            type: Elements.types.string
        },
    links:
        {
            control: Controls.url_box,
            type: Elements.types.resource
        },
    mimeType:
        {
            control: Controls.input_box,
            type: Elements.types.string
        },
    plainTextContent:
        {
            control: Controls.markdown_box,
            type: Elements.types.long_string,
            locked: true
        },
    relatedTo:
        {
            control: Controls.url_box,
            type: Elements.types.resource
        },
    rootElementOf:
        {
            control: Controls.url_box,
            type: Elements.types.resource
        },
    subject:
        {
            control: Controls.input_box,
            type: Elements.types.string
        },
    title:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            backuppable: true,
            restorable: true,
            locked_for_projects: true,
            api_readable: true,
            locked: true
        },
    version:
        {
            control: Controls.input_box,
            type: Elements.types.resource,
            locked: true
        },
    lastModified:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    url:
        {
            type: Elements.types.resource,
            control: Controls.url_box
        },
    contentModified:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    coreGraph:
        {
            type: Elements.types.resource,
            control: Controls.url_box
        },
    htmlContent:
        {
            type: Elements.types.long_string,
            control: Controls.markdown_box
        },
    modified:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    sourceMode:
        {
            type: Elements.types.string,
            control: Controls.input_box
        }
};

/**
 * "NEPOMUK File Ontology" ontology
 * http://www.semanticdesktop.org/ontologies/nfo/
 */

Elements.ontologies.nfo = {
    aspectRatio:
        {
            control: Controls.input_box,
            type: Elements.types.string
        },
    averageBitrate:
        {
            control: Controls.input_box,
            type: Elements.types.int
        },
    belongsToContainer:
        {
            control: Controls.url_box,
            type: Elements.types.resource
        },
    bitDepth:
        {
            control: Controls.input_box,
            type: Elements.types.int
        },
    bitsPerSample:
        {
            control: Controls.input_box,
            type: Elements.types.int
        },
    bookmarks:
        {
            control: Controls.url_box,
            type: Elements.types.resource
        },
    channels:
        {
            control: Controls.input_box,
            type: Elements.types.int
        },
    characterCount:
        {
            control: Controls.input_box,
            type: Elements.types.int
        },
    codec:
        {
            control: Controls.input_box,
            type: Elements.types.string
        },
    commentCharacterCount:
        {
            control: Controls.input_box,
            type: Elements.types.int
        },
    compressionType:
        {
            control: Controls.input_box,
            type: Elements.types.string
        },
    conflicts:
        {
            control: Controls.url_box,
            type: Elements.types.resource
        },
    containsBookmark:
        {
            control: Controls.url_box,
            type: Elements.types.resource
        },
    containsBookmarkFolder:
        {
            control: Controls.url_box,
            type: Elements.types.resource
        },
    count:
        {
            control: Controls.input_box,
            type: Elements.types.int
        },
    definesClass:
        {
            control: Controls.input_box,
            type: Elements.types.resource
        },
    definesFunction:
        {
            control: Controls.input_box,
            type: Elements.types.resource
        },
    definesGlobalVariable:
        {
            control: Controls.input_box,
            type: Elements.types.resource
        },
    deletionDate:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    duration:
        {
            control: Controls.input_box,
            type: Elements.types.string
        },
    encoding:
        {
            control: Controls.input_box,
            type: Elements.types.string
        },
    fileCreated:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    fileLastAccessed:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    fileLastModified:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    fileName:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    fileOwner:
        {
            type: Elements.types.resource,
            control: Controls.url_box
        },
    fileSize:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    fileUrl:
        {
            type: Elements.types.resource,
            control: Controls.url_box
        },
    fontFamily:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    foundry:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    frameCount:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    frameRate:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    frontChannels:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    hasHash:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    hasMediaFileListEntry:
        {
            type: Elements.types.resource,
            control: Controls.url_box
        },
    hasMediaStream:
        {
            type: Elements.types.resource,
            control: Controls.input_box
        },
    hashAlgorithm:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    hashValue:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    height:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    horizontalResolution:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    interlaceMode:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    isPassswordProtected:
        {
            type: Elements.types.boolean,
            control: Controls.input_box
        },
    lfeChannels:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    lineCount:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    losslessCompressionType:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    lossyCompressionType:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    originalLocation:
        {
            type: Elements.types.resource,
            control: Controls.url_box
        },
    pageCount:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    permissions:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    programmingLanguage:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    rate:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    rearChannels:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    sampleCount:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    sampleRate:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    sideChannels:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    supercedes:
        {
            type: Elements.types.resource,
            control: Controls.url_box
        },
    uncompressedSize:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    verticalResolution:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    width:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    wordCount:
        {
            type: Elements.types.int,
            control: Controls.input_box
        },
    bitrateType:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    characterPosition:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    colorCount:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    colorDepth:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    containsPlacemark:
        {
            type: Elements.types.string,
            control: Controls.map
        },
    depiction:
        {
            type: Elements.types.resource,
            control: Controls.input_box
        },
    depicts:
        {
            type: Elements.types.resource,
            control: Controls.url_box
        },
    encryptionStatus:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    filesystemType:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    freeSpace:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    isPasswordProtected:
        {
            type: Elements.types.boolean,
            control: Controls.input_box
        },
    occupiedSpace:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    pageNumber:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    paletteSize:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    streamPosition:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    totalSpace:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    uuid:
        {
            type: Elements.types.string,
            control: Controls.input_box
        }
};

Elements.ontologies.research = {
    /* sampleCollectionDate :
    {
        type : Elements.types.date,
        control : Controls.input_box
    },
    sample_count:
    {
        type : Elements.types.string,
        control : Controls.input_box
    },*/
    instrumentation:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    measurement:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    method:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    sample:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    software:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    hasRegex:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            private: true
        },
    hasAlternative:
        {
            type: Elements.types.string,
            control: Controls.input_box,
            private: true
        }
};

Elements.ontologies.dcb = {
    specimen:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    specimenProperties:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    specimenProperty:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    initialCrackLenght:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    specimenHeight:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    specimenLength:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    specimenWidth:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    instrumentName:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    method:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    moisture:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    temperature:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    testVelocity:
        {
            type: Elements.types.string,
            control: Controls.input_box
        }
};

Elements.ontologies.achem = {
    compound:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    sampleCount:
        {
            type: Elements.types.string,
            control: Controls.input_box
        }
};

Elements.ontologies.bdv = {
    identifierCode:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    conditionApplyingToAccessAndUse:
        {
            type: Elements.types.resource,
            control: Controls.input_box
        },
    conformityDate:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    conformityDateType:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    conformityDegree:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    conformitySpecification:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    conformitySpecificationTitle:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    coupledResource:
        {
            type: Elements.types.resource,
            control: Controls.url_box
        },
    dateOfCreation:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    dateOfLastRevision:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    dateOfPublication:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    diagnosticAndUsability:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    distributionFormatName:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    equivalentScale:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    geographicBoundBox:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    geographicExtentCode:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    identifierNamespace:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    keywordINSPIRE:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    keywordValue:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    lineage:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    linkage:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    limitationOnPublicAccess:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    metadataDate:
        {
            type: Elements.types.string,
            control: Controls.date_picker
        },
    metadataLanguage:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    metadataPointOfContact:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    metadataPointOfContactEmail:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    organizationEmail:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    organizationName:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    originatingControlledVocabulary:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    originatingControlledVocabularyDateType:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    originatingControlledVocabularyReferenceDate:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    originatingControlledVocabularyTitle:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    projectName:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    referenceSystemAuthority:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    referenceSystemIdentifier:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    referenceSystemIdentifierCode:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    referenceSystemIdentifierCodeSpace:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    referenceSystemCode:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    resolutionDistance:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    resourceAbstract:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    resourceLanguage:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    resourceTitle:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    responsibleParty:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    responsiblePartyRole:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    spatialRepresentation:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    spatialResolution:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    spatialResolutionUnitMeasure:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    spatialServiceDataType:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    temporalExtentEndingDate:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    temporalExtentStartingDate:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    uniqueResourceIdentifier:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    version:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    topicCategory:
        {
            type: Elements.types.resource,
            control: Controls.input_box
        },
    identifierNameSpace:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    referencesSystemCode:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    resourceLocator:
        {
            type: Elements.types.string,
            control: Controls.input_box
        }
};

Elements.ontologies.tsim = {
    aerodynamicDragCoefficient:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    airDensity:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    controllerEfficiency:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    drivingCycle:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    gearRatio:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    gravitationalAcceleration:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    roadSurfaceCoefficient:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    tireRadius:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    vehicle:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    vehicleMass:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    vehicleModel:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    vehicleFrontalArea:
        {
            type: Elements.types.string,
            control: Controls.input_box
        }
};

Elements.ontologies.biocn = {
    beginDate:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    commonName:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    endDate:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    geographicDescription:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    lifeStage:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    individualCount:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    individualsPerSpecies:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    observedWeight:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    speciesCount:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    sampleDestination:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    sampleIdentification:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    samplingDescription:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    samplingEffort:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    samplingPeriodicity:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    scientificName:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    sex:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    singleDateTime:
        {
            type: Elements.types.string,
            control: Controls.input_box
        }
};

Elements.ontologies.grav = {
    altitudeDatumName:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    altitudeDistanceUnits:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    altitudeSystemDefinition:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    beginningTime:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    endingTime:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    geographicBoundingBox:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    altitudeResolution:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    resolutionDistance:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    temporalExtentEndingDate:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    temporalExtentStartingDate:
        {
            type: Elements.types.date,
            control: Controls.date_picker
        },
    altitudeEncodingMethods:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        }
};

Elements.ontologies.hdg = {
    additive:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    catalyst:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    Exemplo_data:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    gravimetricCapacity:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    hydrationFactor:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    hydrogenGenerationRate:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    hydrolysis:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    numberOfReutilization:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    reactorType:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    reagent:
        {
            type: Elements.types.string,
            control: Controls.input_box
        }
};

Elements.ontologies.cep = {
    applicationDomain:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    boardType:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    convexNonConvex:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    coordinateOrigin:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    gridType:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    hardwareConfiguration:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    heuristics:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    inputProperty:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    resultProperty:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    solver:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    solverConfiguration:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    typologyWascher:
        {
            type: Elements.types.string,
            control: Controls.input_box
        }
};

Elements.ontologies.social = {
    dataCollectionDate:
        {
            type: Elements.types.string,
            control: Controls.date_picker
        },
    dataCollectionMethodology:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    dataCollectionSoftware:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    dataSource:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    externalAid:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    kindOfData:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    methodology:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    sampleSize:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    samplingProcedure:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    universe:
        {
            type: Elements.types.string,
            control: Controls.input_box
        }
};

Elements.ontologies.cfd = {
    analyticalSolution:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    boundaryCondition:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    computationalDomain:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    convergenceCriteria:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    flowCase:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    initialCondition:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    mathematicalModel:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    numericalGrid:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    numericalMethod:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    surfaceRoughness:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    temporalDiscretization:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    totalSimulatedTime:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    underrelaxation:
        {
            type: Elements.types.string,
            control: Controls.input_box
        }
};

/**
 * Elements of the TVU
 */
Elements.ontologies.tvu =
    {
        comment:
            {
                type: Elements.types.string,
                control: Controls.markdown_box
            },
        dateLastUpdated:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        endDateTime:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        startDateTime:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        episodeNumber:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        publicationDate:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        quotation:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        aspectRatio:
            {
                type: Elements.types.string,
                control: Controls.markdown_box
            },
        averageBitRate:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        codecName:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        duration:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        eventEndDate:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        eventStartDate:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        fileName:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        fileSize:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        frameRate:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        height:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        homepageOffice:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        locationDescription:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        officeMailAddress:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        playbackSpeed:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        relatedResources:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        sampleRate:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        samplingFormat:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        telephoneOffice:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        width:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        attachments:
            {
                type: Elements.types.string,
                control: Controls.markdown_box
            },
        chapters:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        curator:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        numberOfFavourites:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        numberOfVisualizations:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        typeOfUpdate:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        videoMakers:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        dataRate:
            {
                type: Elements.types.string,
                control: Controls.markdown_box
            },
        soundField:
            {
                type: Elements.types.string,
                control: Controls.input_box
            }
    };

/**
 * Elements of the Programmes Ontology
 */
Elements.ontologies.po =
    {
        actor:
            {
                type: Elements.types.string,
                control: Controls.markdown_box
            },
        channel:
            {
                type: Elements.types.string,
                control: Controls.input_box

            },
        commentator:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        genre:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        location:
            {
                type: Elements.types.string,
                control: Controls.input_box
            }
    };

/**
 * Elements of the Discovery
 */
Elements.ontologies.disco =
    {
        computationBase:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        purpose:
            {
                type: Elements.types.string,
                control: Controls.markdown_box
            },
        caseQuantity:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        startDate:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        endDate:
            {
                type: Elements.types.string,
                control: Controls.input_box
            }
    };

/**
 * Elements of the ddiup
 */
Elements.ontologies.ddiup = {
    data_collection:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    scale_reference:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    scale_domain:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    scale_dimension:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    dependent_dimension:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    independent_dimension:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    sample_size:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    deviation_from_sample_design:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    sampling_procedure:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    time_method:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    methodology:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    analysis_unit:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    based_on:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    collection_mode:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    concept:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    data_file:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    instrument:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    kind_of_data:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    product:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    question:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    representation:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    response_domain:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    statistics_category:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    statistics_data_file:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    statistics_variable:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    summary_statistics_type:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    universe:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    variable:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    weighted_by:
        {
            type: Elements.types.string,
            control: Controls.input_box
        }
};

/**
 * Elements of the m3lite ontology
 *
 */

Elements.ontologies.m3lite = {
    calibrationMeasurementType:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    coordinates:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    device:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    workingState:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    connectedUsers:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    count:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    unit:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    transportationDOI:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    measurementType:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    distance:
        {
            type: Elements.types.string,
            control: Controls.input_box
        }
};

/**
 * Elements of the ssn ontology
 *
 */

Elements.ontologies.ssn = {
    observation:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    observationSamplingTime:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    region:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    startTime:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    endTime:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    observationResult:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    measurementRange:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    sensor:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    sensorDataSheet:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    frequency:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    sensingMethodUsed:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    system:
        {
            type: Elements.types.string,
            control: Controls.markdown_box
        },
    platform:
        {
            type: Elements.types.string,
            control: Controls.input_box
        }
};

/**
 * Elements of the chemistry ontology
 */
Elements.ontologies.chm = {
    absorbanceMeasurementInstrument:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    absorbanceMeasurementTechnique:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    acidSolution:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    adsorbentArea:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    adsorbentAshTenor:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    adsorbentMolecularFormula:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    analysisMethod:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    atmosphereConditions:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    catalystAnalysisInstrument:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    catalystArea:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    chemicalElement:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    cleaningsolution:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    controlSolution:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    degradatedCompoundAmount:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    electromagneticRadiationMeasurementTechnique:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    gasPhaseFlow:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    interfacialDistance:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    lightIntensityMeasurementInstrument:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    lightIntensityMeasurementTime:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    lightRadiationInstrument:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    oxidantAgent:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    oxidationPotential:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    ozonationTime:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    ozonisationReactorTechnique:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    particleRemovalTechnique:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    particleSize:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    phMeasurementInstrument:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    photocatalyticActivity:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    photocatalyticReactionVessel:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    polyphenolFormula:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    polyphenolMolecularMass:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    purityDegree:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    sampleCentrifugedAmount:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    sampleCrystalliteSize:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    samplePoreVolume:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    sampleReference:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    solarLightIntensity:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    solutionPh:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    studiedGas:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    surfaceAreaMeasurementInstrument:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    surfaceAreaMeasurementTechnique:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    suspensionStirringTime:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    totalCarbon:
        {
            type: Elements.types.string,
            control: Controls.input_box
        },
    totalOrganicCarbon:
        {
            type: Elements.types.string,
            control: Controls.input_box
        }
};

/**
 * Elements of the Physics
 */
Elements.ontologies.p0 =
    {
        pulseDuration:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        pulseFrequency:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        pulseWaveLenght:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        synteshisMethod:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        synthesisTemperature:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },

        pulseDurationTime:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        radiationEmissionInstrument:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        sampleSynthesisInstrument:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        pulseEnergy:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        sampleMass:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },

        annealingTemperature:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        annealingTime:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        substrateTemperature:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        substrateCleaningMethod:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        substrateDimension:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },

        substrateType:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        sampleDryingTime:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        sampleDryingTemperature:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        sampleDrying:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        extinctionCoefficient:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        depositionTime:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        characterizatioTechnique:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        bathConfiguration:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        semiconductorType:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        depositionPotential:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        bandGap:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        absorbentLayerManufacturingTechnique:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        dielectricConstantImaginaryPart:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        dielectricConstantRealPart:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        transmittance:
            {
                type: Elements.types.string,
                control: Controls.input_box
            }
    };

/**
 * Elements of the Minimum Information for Biological and Biomedical Investigations
 */
Elements.ontologies.mibbiup =
    {
        Age:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Assay_Type:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Cell_Line:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Cell_Type:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Collection_Date:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Development_Stage:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Disease:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Drug_Usage:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Environmental_Factor:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Ethnicity:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Experimental_Factor:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Instrument_Name:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Instrument_Type:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Material:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Measurement:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Method:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Molecule:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Organism:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Organism_Part:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Reagent:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Sample_Collection_Protocol:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Sample_Size:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Sample_Type:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Sex:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Software:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Study_Design:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Study_Domain:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Temperature:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Tissue:
            {
                type: Elements.types.string,
                control: Controls.input_box
            },
        Treatment_Protocol:
            {
                type: Elements.types.string,
                control: Controls.input_box
            }
    };

/**
 * Elements of the imgdata
 */
Elements.ontologies.imgdata =
    {
        amostra:
            {
                type: Elements.string,
                control: Controls.markdown_box
            },
        autor:
            {
                type: Elements.string,
                control: Controls.input_box
            },
        coberturaEspacial:
            {
                type: Elements.string,
                control: Controls.input_box
            },
        data:
            {
                type: Elements.string,
                control: Controls.input_box
            },
        descricao:
            {
                type: Elements.string,
                control: Controls.markdown_box
            },
        direitosUtilizacao:
            {
                type: Elements.string,
                control: Controls.input_box
            },
        escala:
            {
                type: Elements.string,
                control: Controls.input_box
            },
        fonte:
            {
                type: Elements.string,
                control: Controls.input_box
            },
        formato:
            {
                type: Elements.string,
                control: Controls.input_box
            },
        instrumento:
            {
                type: Elements.string,
                control: Controls.input_box
            },
        metodologia:
            {
                type: Elements.string,
                control: Controls.markdown_box
            },
        periodoTemporal:
            {
                type: Elements.string,
                control: Controls.input_box
            },
        qualidade:
            {
                type: Elements.string,
                control: Controls.markdown_box
            },
        tipo: {
            type: Elements.string,
            control: Controls.input_box
        },
        titulo:
            {
                type: Elements.string,
                control: Controls.input_box
            }
    };

Elements.setAllElements = function (loadedElements)
{
    for (let i = 0; i < loadedElements.length; i++)
    {
        let loadedElement = loadedElements[i];
        let prefix = loadedElement.prefix;
        let shortName = loadedElement.shortName;

        let existingElement = Elements.ontologies[prefix][shortName];

        if (!isNull(existingElement))
        {
            for (let k in loadedElement)
            {
                if (loadedElement.hasOwnProperty(k))
                {
                    if (isNull(existingElement[k]))
                    {
                        Elements.ontologies[prefix][shortName][k] = loadedElement[k];
                    }
                }
            }
        }
        else
        {
            Logger.log("warn", "Element: " + "Elements.ontologies[" + prefix + "][" + shortName + "]" + " does not exist. This indicates that either the " + Elements.ontologies[prefix].uri + " ontology is outdated or the elements.js configuration needs to be updated for new elements in the ontology.");
        }
    }

    return Elements.ontologies;
};

module.exports.Elements = Elements;
