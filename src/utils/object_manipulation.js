// from https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject (item)
{
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
function mergeDeep (target, ...sources)
{
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source))
    {
        for (let key in source)
        {
            if (isObject(source[key]))
            {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            }
            else
            {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

module.exports.mergeDeep = mergeDeep;
