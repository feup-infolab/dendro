const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const _ = require("underscore");

const isNull = rlequire("dendro", "src/utils/null.js").isNull;

function Class ()
{
    const newClass = Object.create(Class);
    return newClass;
}

const copyPrototypeFromParent = function (parentClass, childClass)
{
    if (isNull(parentClass) || parentClass === Class)
    {
        return childClass;
    }
    childClass.baseConstructor = parentClass;
    childClass.prototype.baseConstructor = parentClass;

    for (aClassMethod in parentClass)
    {
        if (aClassMethod !== "prototype")
        {
            if (isNull(childClass[aClassMethod]))
            {
                childClass[aClassMethod] = parentClass[aClassMethod];
            }
            else
            {
                childClass[aClassMethod] = childClass[aClassMethod]; // superfluous, for debugging
            }
        }
    }

    for (aClassMethod in parentClass.prototype)
    {
        if (isNull(childClass.prototype[aClassMethod]))
        {
            childClass.prototype[aClassMethod] = parentClass.prototype[aClassMethod];
        }
    }

    // const grandparentClass = parentClass.baseConstructor;

    // const childClassWithGrandparentMethods = copyPrototypeFromParent(grandparentClass, childClass);
    return childClass;
};

const getParentConstructor = function (parentClass)
{
    return parentClass;
};

Class.extend = function (childClass, parentClass, rdfTypeForSavingInDatabase)
{
    let prefixedRDFTypes = Class.getAllPrefixedRDFTypes(parentClass);

    if (rdfTypeForSavingInDatabase)
    {
        if(prefixedRDFTypes.length === 0)
        {
            childClass.prefixedRDFType = rdfTypeForSavingInDatabase;
        }
        else
        {
            childClass.prefixedRDFType = prefixedRDFTypes.concat([rdfTypeForSavingInDatabase]);
        }
    }

    childClass.baseConstructor = getParentConstructor(parentClass);
    childClass.prototype.baseConstructor = getParentConstructor(parentClass);
    childClass.leafClass = rdfTypeForSavingInDatabase;

    let childClassWithFamilyTreePrototypes = copyPrototypeFromParent(parentClass, childClass);

    return childClassWithFamilyTreePrototypes;
};

Class.getAllPrefixedRDFTypes = function(prototype)
{
    let parent = prototype;
    let prefixedRDFTypes = [];

    while (parent !== null && typeof parent !== "undefined" && parent !== Class)
    {
        if(parent.leafClass)
        {
            prefixedRDFTypes.push(parent.leafClass);
        }

        parent = parent.baseConstructor;
    }

    return prefixedRDFTypes.sort();
}

module.exports.Class = Class;
