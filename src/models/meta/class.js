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
    if (rdfTypeForSavingInDatabase)
    {
        if (isNull(parentClass.prefixedRDFType))
        {
            childClass.prefixedRDFType = rdfTypeForSavingInDatabase;
        }
        else if (parentClass.prefixedRDFType instanceof Array)
        {
            childClass.prefixedRDFType = [rdfTypeForSavingInDatabase];
            childClass.prefixedRDFType = parentClass.prefixedRDFType.concat(childClass.prefixedRDFType);
        }
        else if (typeof parentClass.prefixedRDFType === "string")
        {
            childClass.prefixedRDFType = [parentClass.prefixedRDFType, rdfTypeForSavingInDatabase];
        }
    }

    childClass.baseConstructor = getParentConstructor(parentClass);
    childClass.prototype.baseConstructor = getParentConstructor(parentClass);
    childClass.leafClass = rdfTypeForSavingInDatabase;

    let childClassWithFamilyTreePrototypes = copyPrototypeFromParent(parentClass, childClass);

    return childClassWithFamilyTreePrototypes;
};

module.exports.Class = Class;
