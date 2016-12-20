var Config = require("./config.js").Config;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;

function Elements() {
}

/**
 * Elements of the DC Ontology
 */

Elements.dcterms =
{
    abstract: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    accessRights: {
        type: DbConnection.string,
        control: Config.controls.input_box

    },
    accrualMethod: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    accrualPeriodicity: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    accrualPolicy: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    alternative: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    audience: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    available: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    bibliographicCitation: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    conformsTo: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    contributor: {
        type: DbConnection.resource,
        control: Config.controls.url_box,
        locked_for_projects: true
    },
    coverage: {
        type: DbConnection.string,
        control: Config.controls.map
    },
    created: {
        type: DbConnection.date,
        control: Config.controls.date_picker,
        api_readable: true,
        locked: true,
        audit: true
    },
    creator: {
        type: DbConnection.resource,
        control: Config.controls.url_box,
        locked_for_projects: true
    },
    date: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    dateAccepted: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    dateCopyrighted: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    dateSubmitted: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    description: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    educationLevel: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    extent: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    format: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    identifier: {
        type: DbConnection.string,
        control: Config.controls.url_box
    },
    instructionalMethod: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    issued: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    language: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    license: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    mediator: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    medium: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    modified: {
        type: DbConnection.date,
        control: Config.controls.date_picker,
        locked: true,
        api_readable: true,
        audit: true
    },
    provenance: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    publisher: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    references: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    relation: {
        type: DbConnection.string,
        control: Config.controls.url_box
    },
    replaces: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    requires: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    rights: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    rightsHolder: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    source: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    spatial: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    subject: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    tableOfContents: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    temporal: {
        type: DbConnection.date,
        control: Config.controls.input_box
    },
    type: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    title: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    hasVersion: {
        type: DbConnection.resource,
        control: Config.controls.url_box,
        locked: true,
        private: true
    },
    hasPart: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    isPartOf: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    hasFormat: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    isFormatOf: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    isReferencedBy: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    isReplacedBy: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    isRequiredBy: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    isVersionOf: {
        type: DbConnection.string,
        control: Config.controls.url_box
    },
    valid: {
        type: DbConnection.string,
        control: Config.controls.input_box
    }
};

/**
 * Elements of the FOAF ontology
 */

Elements.foaf =
{
    mbox: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    firstName: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    surname: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    account: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    accountName: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    accountServiceHomepage: {
        type: DbConnection.resource,
        control: Config.controls.input_box
    },
    age: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    aimChatID: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    based_near: {
        type: DbConnection.string,
        control: Config.controls.map
    },
    birthday: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    currentProject: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    depiction: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    depicts: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    dnaChecksum: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    familyName: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    focus: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    fundedBy: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    geekcode: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    gender: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    givenName: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    holdsAccount: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    homepage: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    icqChatID: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    img: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    interest: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    jabberID: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    knows: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    lastName: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    logo: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    made: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    maker: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    mbox_sha1sum: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    member: {
        type: DbConnection.string,
        control: Config.controls.url_box
    },
    membershipClass: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    msnChatID: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    name: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    nick: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    openid: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    page: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    pastProject: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    phone: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    plan: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    primaryTopic: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    publications: {
        type: DbConnection.string,
        control: Config.controls.url_box
    },
    schoolHomepage: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    sha1: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    skypeID: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    status: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    theme: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    tipjar: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    title: {
        type: DbConnection.string,
        control: Config.controls.input_box,
        backuppable: true,
        restorable: true
    },
    topic: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    topic_interest: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    weblog: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    workInfoHomepage: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    workplaceHomepage: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    yahooChatID: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    family_name: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    givenname: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    isPrimaryTopicOf: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    myersBriggs: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    thumbnail: {
        type: DbConnection.string,
        control: Config.controls.input_box
    }
};

/**
 * Dendro Ontology types
 */

Elements.ddr = {
    handle: {
        type: DbConnection.string,
        control: Config.controls.input_box,
        locked_for_projects: true
    },
    password: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    password_reset_token: {
        type: DbConnection.string,
        control: Config.controls.input_box,
        private: true,
        locked: true
    },
    text_content: {
        type: DbConnection.long_string,
        control: Config.controls.markdown_box
    },
    username: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    fileExtension: {
        type: DbConnection.string,
        control: Config.controls.input_box,
        backuppable: true,
        restorable: true,
        locked: true
    },
    lastHarvested: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    md5Checksum: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    sourceRepository: {
        type: DbConnection.string,
        control: Config.controls.url_box
    },
    rootFolder: {
        type: DbConnection.resource,
        control: Config.controls.url_box,
        locked: true
    },
    checksum: {
        type: DbConnection.string,
        backuppable: true,
        control: Config.controls.input_box
    },
    isVersionOf: {
        type: DbConnection.resource,
        api_readable: true,
        audit: true,
        control: Config.controls.url_box
    },
    versionCreator: {
        type: DbConnection.resource,
        api_readable: true,
        audit: true,
        control: Config.controls.url_box
    },
    versionNumber: {
        type: DbConnection.int,
        api_readable: true,
        audit: true,
        control: Config.controls.input_box
    },
    changedDescriptor: {
        type: DbConnection.property,
        control: Config.controls.url_box
    },
    oldValue: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    newValue: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    changeType: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    pertainsTo: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    changeIndex: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    deleted: {
        type: DbConnection.boolean,
        backuppable: true,
        api_readable: true,
        control: Config.controls.input_box
    },
    performedBy: {
        type: DbConnection.resource,
        api_readable: true,
        control: Config.controls.url_box
    },
    interactionType: {
        type: DbConnection.string,
        api_readable: true,
        control: Config.controls.input_box
    },
    executedOver: {
        type: DbConnection.resource,
        api_readable: true,
        control: Config.controls.url_box
    },
    originallyRecommendedFor: {
        type: DbConnection.resource,
        api_readable: true,
        control: Config.controls.url_box
    },
    hasUsername: {
        type: DbConnection.string,
        api_readable: true,
        control: Config.controls.url_box
    },
    hasPlatform: {
        type: DbConnection.resource,
        api_readable: true,
        control: Config.controls.url_box
    },
    hasExternalUri: {
        type: DbConnection.resource,
        api_readable: true,
        control: Config.controls.url_box
    },
    hasOrganization: {
        type: DbConnection.resource,
        api_readable: true,
        control: Config.controls.url_box
    },
    hasSwordCollectionUri: {
        type: DbConnection.string,
        api_readable: true,
        control: Config.controls.url_box
    },
    hasSwordCollectionLabel: {
        type: DbConnection.string,
        api_readable: true,
        control: Config.controls.input_box
    },
    hasConsumerKey: {
        type: DbConnection.string,
        api_readable: true,
        control: Config.controls.input_box
    },
    hasConsumerSecret: {
        type: DbConnection.string,
        api_readable: true,
        control: Config.controls.input_box
    },
    hasAccessToken: {
        type: DbConnection.string,
        api_readable: true,
        control: Config.controls.input_box
    },
    hasAccessTokenSecret: {
        type: DbConnection.string,
        api_readable: true,
        control: Config.controls.input_box
    },
    //uncategorized descriptor (for when researcheers dont know which descriptor to select)
    generic: {
        type: DbConnection.string,
        control: Config.controls.input_box,
        api_readable: true
    },
    rankingPosition: {
        type: DbConnection.int,
        api_readable: true,
        control: Config.controls.input_box
    },
    lastDescriptorRecommendationsList: {
        type: DbConnection.long_string,
        control: Config.controls.markdown_box
    },
    hasPrefix: {
        type: DbConnection.string,
        api_readable: true,
        control: Config.controls.input_box
    },
    hasResearchDomain: {
        type: DbConnection.string,
        api_readable: true,
        control: Config.controls.input_box

    },
    metadataQuality: {
        type: DbConnection.int,
        api_readable: true,
        control: Config.controls.input_box
    },
    privacyStatus: {
        type: DbConnection.string,
        api_readable: true,
        control: Config.controls.input_box,
        locked_for_project: true
    },
    hasContent: {
        type: DbConnection.string,
        api_readable: true,
        control: Config.controls.input_box
    },
    beingBackedUp: {
        type: DbConnection.boolean,
        api_readable: true,
        locked: true,
        control: Config.controls.input_box
    },
};

/**
 * RDF Ontology types
 */

Elements.rdf = {
    first: {
        type: DbConnection.resource,
        control: Config.controls.input_box
    },
    object: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    predicate: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    rest: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    subject: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    type: {
        type: DbConnection.prefixedResource,
        locked: true,
        api_readable: true,
        control: Config.controls.input_box
    },
    value: {
        type: DbConnection.string,
        control: Config.controls.input_box
    }
}

/**
 * Nepomuk Information Element Ontology
 * http://www.semanticdesktop.org/ontologies/nie/
 */
Elements.nie = {
    byteSize: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    characterSet: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    comment: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    contentCreated: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    contentLastModified: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    contentSize: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    copyright: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    created: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    dataSource: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    depends: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    description: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    disclaimer: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    generator: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    generatorOption: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    hasLogicalPart: {
        type: DbConnection.resource,
        control: Config.controls.url_box,
        backuppable: true,
        locked: true
    },
    hasPart: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    identifier: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    informationElementDate: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    interpretedAs: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    isLogicalPartOf: {
        control: Config.controls.url_box,
        type: DbConnection.resource,
        backuppable: true,
        locked: true
    },
    isPartOf: {
        control: Config.controls.url_box,
        type: DbConnection.resource,
        backuppable: true,
        locked: true
    },
    isStoredAs: {
        control: Config.controls.input_box,
        type: DbConnection.string
    },
    keyword: {
        control: Config.controls.input_box,
        type: DbConnection.string
    },
    language: {
        control: Config.controls.input_box,
        type: DbConnection.string
    },
    lastRefreshed: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    legal: {
        control: Config.controls.input_box,
        type: DbConnection.string
    },
    license: {
        control: Config.controls.markdown_box,
        type: DbConnection.string
    },
    licenseType: {
        control: Config.controls.input_box,
        type: DbConnection.string
    },
    links: {
        control: Config.controls.url_box,
        type: DbConnection.resource
    },
    mimeType: {
        control: Config.controls.input_box,
        type: DbConnection.string
    },
    plainTextContent: {
        control: Config.controls.markdown_box,
        type: DbConnection.long_string
    },
    relatedTo: {
        control: Config.controls.url_box,
        type: DbConnection.resource
    },
    rootElementOf: {
        control: Config.controls.url_box,
        type: DbConnection.resource
    },
    subject: {
        control: Config.controls.input_box,
        type: DbConnection.string
    },
    title: {
        type: DbConnection.string,
        backuppable: true,
        restorable: true,
        locked: true
    },
    version: {
        control: Config.controls.input_box,
        type: DbConnection.resource,
        locked: true
    },
    lastModified: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    url: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    contentModified: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    coreGraph: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    htmlContent: {
        type: DbConnection.long_string,
        control: Config.controls.markdown_box
    },
    modified: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    sourceMode: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    title: {
        type: DbConnection.date,
        control: Config.controls.input_box,
        private: true,
        locked: true
    }
};

/**
 * "NEPOMUK File Ontology" ontology
 * http://www.semanticdesktop.org/ontologies/nfo/
 */

Elements.nfo = {
    aspectRatio: {
        control: Config.controls.input_box,
        type: DbConnection.string
    },
    averageBitrate: {
        control: Config.controls.input_box,
        type: DbConnection.int
    },
    belongsToContainer: {
        control: Config.controls.url_box,
        type: DbConnection.resource
    },
    bitDepth: {
        control: Config.controls.input_box,
        type: DbConnection.int
    },
    bitsPerSample: {
        control: Config.controls.input_box,
        type: DbConnection.int
    },
    bookmarks: {
        control: Config.controls.url_box,
        type: DbConnection.resource
    },
    channels: {
        control: Config.controls.input_box,
        type: DbConnection.int
    },
    characterCount: {
        control: Config.controls.input_box,
        type: DbConnection.int
    },
    codec: {
        control: Config.controls.input_box,
        type: DbConnection.string
    },
    commentCharacterCount: {
        control: Config.controls.input_box,
        type: DbConnection.int
    },
    compressionType: {
        control: Config.controls.input_box,
        type: DbConnection.string
    },
    conflicts: {
        control: Config.controls.url_box,
        type: DbConnection.resource
    },
    containsBookmark: {
        control: Config.controls.url_box,
        type: DbConnection.resource
    },
    containsBookmarkFolder: {
        control: Config.controls.url_box,
        type: DbConnection.resource
    },
    count: {
        control: Config.controls.input_box,
        type: DbConnection.int
    },
    definesClass: {
        control: Config.controls.input_box,
        type: DbConnection.resource
    },
    definesFunction: {
        control: Config.controls.input_box,
        type: DbConnection.resource
    },
    definesGlobalVariable: {
        control: Config.controls.input_box,
        type: DbConnection.resource
    },
    deletionDate: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    duration: {
        control: Config.controls.input_box,
        type: DbConnection.string
    },
    encoding: {
        control: Config.controls.input_box,
        type: DbConnection.string
    },
    fileCreated: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    fileLastAccessed: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    fileLastModified: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    fileName: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    fileOwner: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    fileSize: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    fileUrl: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    fontFamily: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    foundry: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    frameCount: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    frameRate: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    frontChannels: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    hasHash: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    hasMediaFileListEntry: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    hasMediaStream: {
        type: DbConnection.resource,
        control: Config.controls.input_box
    },
    hashAlgorithm: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    hashValue: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    height: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    horizontalResolution: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    interlaceMode: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    isPassswordProtected: {
        type: DbConnection.boolean,
        control: Config.controls.input_box
    },
    lfeChannels: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    lineCount: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    losslessCompressionType: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    lossyCompressionType: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    originalLocation: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    pageCount: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    permissions: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    programmingLanguage: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    rate: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    rearChannels: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    sampleCount: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    sampleRate: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    sideChannels: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    supercedes: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    uncompressedSize: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    verticalResolution: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    width: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    wordCount: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    bitrateType: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    characterPosition: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    colorCount: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    colorDepth: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    containsPlacemark: {
        type: DbConnection.string,
        control: Config.controls.map
    },
    depiction: {
        type: DbConnection.resource,
        control: Config.controls.input_box
    },
    depicts: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    encryptionStatus: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    filesystemType: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    freeSpace: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    isPasswordProtected: {
        type: DbConnection.boolean,
        control: Config.controls.input_box
    },
    occupiedSpace: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    pageNumber: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    paletteSize: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    streamPosition: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    totalSpace: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    uuid: {
        type: DbConnection.string,
        control: Config.controls.input_box
    }
};

Elements.research = {
    /*sampleCollectionDate :
     {
     type : DbConnection.date,
     control : Config.controls.input_box
     },
     sample_count:
     {
     type : DbConnection.string,
     control : Config.controls.input_box
     },*/
    instrumentation: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    measurement: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    method: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    sample: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    software: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    hasRegex: {
        type: DbConnection.string,
        control: Config.controls.input_box,
        private: true
    },
    hasAlternative: {
        type: DbConnection.string,
        control: Config.controls.input_box,
        private: true
    }
};

Elements.dcb = {
    specimen: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    specimenProperties: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    specimenProperty: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    initialCrackLenght: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    specimenHeight: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    specimenLength: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    specimenWidth: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    instrumentName: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    method: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    moisture: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    temperature: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    testVelocity: {
        type: DbConnection.string,
        control: Config.controls.input_box
    }
};

Elements.achem = {
    compound: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    sampleCount: {
        type: DbConnection.string,
        control: Config.controls.input_box
    }
};

Elements.bdv = {
    identifierCode: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    conformityDate: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    conformityDateType: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    conformityDegree: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    conformitySpecification: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    conformitySpecificationTitle: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    coupledResource: {
        type: DbConnection.resource,
        control: Config.controls.url_box
    },
    dateOfCreation: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    dateOfLastRevision: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    dateOfPublication: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    diagnosticAndUsability: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    distributionFormatName: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    equivalentScale: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    geographicBoundBox: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    geographicExtentCode: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    identifierNamespace: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    keywordINSPIRE: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    keywordValue: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    lineage: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    linkage: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    metadataDate: {
        type: DbConnection.string,
        control: Config.controls.date_picker
    },
    metadataLanguage: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    metadataPointOfContact: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    metadataPointOfContactEmail: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    organizationEmail: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    organizationName: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    originatingControlledVocabulary: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    originatingControlledVocabularyDateType: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    originatingControlledVocabularyReferenceDate: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    originatingControlledVocabularyTitle: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    projectName: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    referenceSystemAuthority: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    referenceSystemIdentifier: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    referenceSystemIdentifierCode: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    referenceSystemIdentifierCodeSpace: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    referenceSystemCode: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    resolutionDistance: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    resourceAbstract: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    resourceLanguage: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    resourceTitle: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    responsibleParty: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    responsiblePartyRole: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    spatialRepresentation: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    spatialResolution: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    spatialResolutionUnitMeasure: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    spatialServiceDataType: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    temporalExtentEndingDate: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    temporalExtentStartingDate: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    uniqueResourceIdentifier: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    version: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    topicCategory: {
        type: DbConnection.resource,
        control: Config.controls.input_box
    },
    identifierNameSpace: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    referencesSystemCode: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    resourceLocator: {
        type: DbConnection.string,
        control: Config.controls.input_box
    }
};

Elements.tsim = {
    aerodynamicDragCoefficient: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    airDensity: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    controllerEfficiency: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    drivingCycle: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    gearRatio: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    gravitationalAcceleration: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    roadSurfaceCoefficient: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    tireRadius: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    vehicle: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    vehicleMass: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    vehicleModel: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    vehicleFrontalArea: {
        type: DbConnection.string,
        control: Config.controls.input_box
    }
};


Elements.biocn = {
    beginDate: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    commonName: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    endDate: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    geographicDescription: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    lifeStage: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    individualCount: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    individualsPerSpecies: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    observedWeight: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    speciesCount: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    sampleDestination: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    sampleIdentification: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    samplingDescription: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    samplingEffort: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    samplingPeriodicity: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    scientificName: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    sex: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    singleDateTime: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    individualsPerSpecies: {
        type: DbConnection.string,
        control: Config.controls.input_box
    }
};

Elements.grav = {
    altitudeDatumName: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    altitudeDistanceUnits: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    altitudeSystemDefinition: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    beginningTime: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    endingTime: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    geographicBoundingBox: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    altitudeResolution: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    resolutionDistance: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    temporalExtentEndingDate: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    temporalExtentStartingDate: {
        type: DbConnection.date,
        control: Config.controls.date_picker
    },
    altitudeEncodingMethods: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    }
};

Elements.hdg = {
    additive: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    catalyst: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    gravimetricCapacity: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    hydrationFactor: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    hydrogenGenerationRate: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    hydrolysis: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    numberOfReutilization: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    reactorType: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    reagent: {
        type: DbConnection.string,
        control: Config.controls.input_box
    }
};

Elements.cep = {
    applicationDomain: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    boardType: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    convexNonConvex: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    coordinateOrigin: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    gridType: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    hardwareConfiguration: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    heuristics: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    inputProperty: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    resultProperty: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    solver: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    solverConfiguration: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    typologyWascher: {
        type: DbConnection.string,
        control: Config.controls.input_box
    }
};

Elements.social = {
    dataCollectionDate: {
        type: DbConnection.string,
        control: Config.controls.date_picker
    },
    dataCollectionMethodology: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    dataCollectionSoftware: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    dataSource: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    externalAid: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    kindOfData: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    methodology: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    sampleSize: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    samplingProcedure: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    universe: {
        type: DbConnection.string,
        control: Config.controls.input_box
    }
};

Elements.cfd = {
    analyticalSolution: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    boundaryCondition: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    computationalDomain: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    convergenceCriteria: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    flowCase: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    initialCondition: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    mathematicalModel: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    numericalGrid: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    numericalMethod: {
        type: DbConnection.string,
        control: Config.controls.markdown_box
    },
    surfaceRoughness: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    temporalDiscretization: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    totalSimulatedTime: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    underrelaxation: {
        type: DbConnection.string,
        control: Config.controls.input_box
    }
};

/**
 * Game Ontology types
 */

Elements.gm = {
    score: {
        type: DbConnection.int,
        control: Config.controls.input_box
    },
    material: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    numActions: {
        type: DbConnection.string,
        control: Config.controls.input_box
    },
    belongsTo: {
        type: DbConnection.resource,
        control: Config.controls.url_box,
        locked: true
    },
    hasType: {
        type: DbConnection.resource,
        control: Config.controls.url_box,
        locked: true
    },
    objectType: {
        type: DbConnection.resource,
        control: Config.controls.url_box,
        locked: true
    },
    hasMedal: {
        type: DbConnection.resource,
        control: Config.controls.url_box,
        locked: true
    }

};


module.exports.Elements = Elements;