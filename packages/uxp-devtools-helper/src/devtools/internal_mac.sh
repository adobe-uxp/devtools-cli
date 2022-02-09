#!/usr/bin/env bash

# Details - first arg is Adobe UXP base Folder, 2nd Arg is the relative folder ( which might need to be created )
# 3rd arg is the settings files itself where the contents will be written to.
# 4th arg is whether to enable or disable the devtols.

baseDir="/Library/Application Support/Adobe/UXP"

# echo "Base dir is $baseDir"

cd "$baseDir"

if [ $? -ne 0 ]; then 
    mkdir -p "$baseDir"
    cd "$baseDir"
    if [ $? -ne 0 ]; then 
        echo "Failed to execute the command. Base Directory $baseDir is not present."
        exit 1;
    fi
fi

devDir="Developer"

mkdir -p $devDir
if [ $? -ne 0 ]; then 
    echo "Failed to create sub-directory $devDir under $baseDir."
    exit 1;
fi

cd $devDir

cat <<EOF > settings.json
{"developer" : $1, "hostAppPluginWorkspace" : $1}
EOF

if [ $? -ne 0 ]; then 
    echo "Failed to write uxp devtools settings to json file."
    exit 1;
fi
