const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;

function Class(){
    const newClass = Object.create(Class);
    return newClass;
}

const copyPrototypeFromParent = function (parentClass, childClass) {
    if (isNull(parentClass) || parentClass === Class) {
        return childClass;
    }
    else {
        childClass.baseConstructor = parentClass;
        childClass.prototype['baseConstructor'] = parentClass;

        for (aClassMethod in parentClass) {
            if (aClassMethod !== "prototype") {
                if (isNull(childClass[aClassMethod])) {
                    childClass[aClassMethod] = parentClass[aClassMethod];
                }
                else {
                    childClass[aClassMethod] = childClass[aClassMethod]; //superfluous, for debugging
                }
            }
        }

        for (aClassMethod in parentClass.prototype) {
            if (isNull(childClass.prototype[aClassMethod])) {
                childClass.prototype[aClassMethod] = parentClass.prototype[aClassMethod];
            }
        }

        const grandparentClass = parentClass.baseConstructor;

        const childClassWithGrandparentMethods = copyPrototypeFromParent(grandparentClass, childClass);
        return childClassWithGrandparentMethods;
    }
};

const getParentConstructor = function (parentClass) {
    return parentClass;
};

Class.extend = function(childClass, parentClass, rdfTypeForSavingInDatabase)
{
    if(rdfTypeForSavingInDatabase)
    {
        if (isNull(parentClass.prefixedRDFType))
        {
            childClass.prefixedRDFType = rdfTypeForSavingInDatabase;
        }
        if(parentClass.prefixedRDFType instanceof Array)
        {
            childClass.prefixedRDFType = [];
            childClass.prefixedRDFType.concat([rdfTypeForSavingInDatabase]);
        }
        else if(typeof parentClass.prefixedRDFType === "string")
        {
            childClass.prefixedRDFType = [parentClass.prefixedRDFType, rdfTypeForSavingInDatabase];
        }
    }

    childClass.baseConstructor = getParentConstructor(parentClass);
    childClass.prototype['baseConstructor'] = getParentConstructor(parentClass);

    let childClassWithFamilyTreePrototypes = copyPrototypeFromParent(parentClass, childClass);

    return childClassWithFamilyTreePrototypes;
};

Class.prototype.isA = function (prototype) {
    let object = this;

    do {
        if (object === prototype) return true;
        object = Object.getPrototypeOf(object);  //for debugging
    }
    while (object);

    return false;
};



module.exports.Class = Class;