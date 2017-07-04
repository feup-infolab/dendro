function parseFile(fileName, callback)
{
	const lineReader = require('line-reader');
	
	lineReader.eachLine(fileName, function(line, last) {
	
	   //get resource URI (First part)
	   let sliceEndIndex = line.indexOf(" ");

		//replace() only replaces first occurrence!
	   const subject = line.substring(0, sliceEndIndex).replace("<", "").replace(">", "");
	   line = line.substring(sliceEndIndex + 1); //step over the space

	   //get Property URI (2nd part of the quad)
	   sliceEndIndex = line.indexOf(" ");

	   const predicate = line.substring(0, sliceEndIndex).replace("<", "").replace(">", ""); //step over the space
	   line = line.substring(sliceEndIndex + 2); //step over the quote and space

	   //get Value (3rd part of the quad)
	   sliceEndIndex = line.indexOf(" ") - 1;

	   const object = line.substring(0, sliceEndIndex);

		try {
		    check(object).notNull().isUrl();
		    check(predicate).notNull().isUrl()
		} catch (e) {
		
		}
	    
		//console.log('Subject is: ' + subject + ' predicate is : ' + predicate + ' object is : ' + object);
	
		if (last) {
            return callback(null);
        }
    });
}
module.exports.parseFile = parseFile;