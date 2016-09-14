#!/bin/bash
 
EXPECTED_ARGS=1
 
if [ $# -ne $EXPECTED_ARGS ]
then
  echo "Usage: `basename $0` {line count}"
  exit $E_BADARGS
fi
 
FILE_LIST="`ls`"
CURRENT_DIR="`pwd`"
 
if [ -d "samples" ]; then
	rm -rf "${CURRENT_DIR}/samples"
	mkdir "${CURRENT_DIR}/samples"
fi
 
for file in ${FILE_LIST}
do
	if [[ -f $file ]]; then
		echo "processing file: $file"
		head -$1 ${CURRENT_DIR}"/$file"  > ${CURRENT_DIR}"/samples/$file" 
	fi
	if [[ -d $file ]]; then
		echo $file" is a directory, skipping"
	fi
done
