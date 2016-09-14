function Class(){
    var newClass = Object.create(Class);
    return newClass;
}

var copyPrototypeFromParent = function(parentClass, childClass)
{
    if(parentClass == null || parentClass === Class)
    {
        return childClass;
    }
    else
    {
        childClass.baseConstructor = parentClass;
        childClass.prototype['baseConstructor'] = parentClass;

        for(aClassMethod in parentClass)
        {
            if(aClassMethod != "prototype" )
            {
                if(childClass[aClassMethod] == null)
                {
                    childClass[aClassMethod] = parentClass[aClassMethod];
                }
                else
                {
                    childClass[aClassMethod] = childClass[aClassMethod]; //superfluous, for debugging
                }
            }
        }

        for(aClassMethod in parentClass.prototype)
        {
            if(childClass.prototype[aClassMethod] == null)
            {
                childClass.prototype[aClassMethod] = parentClass.prototype[aClassMethod];
            }
        }

        var grandparentClass = parentClass.baseConstructor;

        var childClassWithGrandparentMethods = copyPrototypeFromParent(grandparentClass, childClass);
        return childClassWithGrandparentMethods;
    }
};

var getParentConstructor = function(parentClass)
{
    var parentConstructor = parentClass;
    return parentConstructor;
};

Class.extend = function(childClass, parentClass)
{
    childClass.baseConstructor = getParentConstructor(parentClass);
    childClass.prototype['baseConstructor'] = getParentConstructor(parentClass);

    var childClassWithFamilyTreePrototypes = copyPrototypeFromParent(parentClass, childClass);

    return childClassWithFamilyTreePrototypes;
};

Class.prototype.isA = function (prototype) {
    var object = this;

    do {
        if (object === prototype) return true;
        var object = Object.getPrototypeOf(object);  //for debugging
    }
    while (object);

    return false;
};

module.exports.Class = Class;