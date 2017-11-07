function IDMapper () {
}

IDMapper.idSeparator = '_f47ac10b-58cc-4372-a567-0e02b2c3d479_'

IDMapper.convertPathToId = function (path) {
  var convertedId = path.replace(/\//g, IDMapper.idSeparator)
  return convertedId
}

IDMapper.convertIdToPath = function (id) {
  var regex = new RegExp(IDMapper.idSeparator, 'g')
  var convertedPath = id.replace(regex, '/')

  return convertedPath
}

if (typeof module !== 'undefined') {
  module.exports.IDMapper = IDMapper
}
