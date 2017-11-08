const path = require("path");
const _ = require("underscore");
const Pathfinder = global.Pathfinder;
const Controls = require(Pathfinder.absPathInSrcFolder("/models/meta/controls.js")).Controls;

function Elements ()
{}

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
    locked_for_projects: "locked_for_projects" // project metadata which cannot be modified using the metadata editor, has to go through the project administrator
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

/**
 * Elements of the schema.org Ontology
 */

Elements.ontologies.schema = {
    sharedContent:
  {
      type: Elements.types.string,
      control: Controls.input_box,
      locked: true,
      api_accessible: true
  },
    provider:
  {
      type: Elements.types.string,
      control: Controls.input_box,
      locked: true,
      api_accessible: true
  },
    telephone:
  {
      type: Elements.types.string,
      control: Controls.input_box,
      locked: true,
      api_accessible: true
  },
    address:
  {
      type: Elements.types.string,
      control: Controls.input_box,
      locked: true,
      api_accessible: true
  },
    license:
  {
      type: Elements.types.string,
      control: Controls.input_box,
      locked: true,
      api_accessible: true
  },
    email:
    {
        type: Elements.types.string,
        control: Controls.input_box,
        locked: true,
        api_accessible: true
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
      type: Elements.types.resource,
      control: Controls.url_box
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
      type: Elements.types.resource,
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
      type: Elements.types.resource,
      control: Controls.url_box,
      locked_for_projects: true
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
      type: Elements.types.resource,
      control: Controls.url_box
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
    socialUpdatedAt:
  {
      type: Elements.types.date,
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
        api_readable: true
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
      locked: true
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
    hasUsername:
  {
      type: Elements.types.string,
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
      control: Controls.input_box
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
      locked: true
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
      locked: true
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
    }, */
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
      type: Elements.types.date,
      control: Controls.date_picker
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

Elements.setAllElements = function (loadedElements)
{
    for (let i = 0; i < loadedElements.length; i++)
    {
        let loadedElement = loadedElements[i];
        let prefix = loadedElement.prefix;
        let shortName = loadedElement.shortName;

        let existingElement = Elements.ontologies[prefix][shortName];

        for (let k in loadedElement)
        {
            if (existingElement[k] === null || typeof existingElement[k] === "undefined")
            {
                Elements.ontologies[prefix][shortName][k] = loadedElement[k];
            }
        }
    }

    return Elements.ontologies;
};

module.exports.Elements = Elements;
