@echo off

set commonDir=%CommonProgramFiles%

set baseDir=%commonDir%\Adobe\UXP

set uxpDevDir=Developer

echo baseDir is %baseDir%

:: Create base dir if it does not exist
IF NOT EXIST "%baseDir%" mkdir "%baseDir%"

:: Check if the base dir exists
IF NOT EXIST "%baseDir%" exit /B 3

cd /D %baseDir%

echo checking for  %uxpDevDir%

IF NOT EXIST %uxpDevDir% mkdir %uxpDevDir%

:: cd into the Developer folder.
cd %uxpDevDir%

:: Now create the settings json file

SET config={"developer": %1}

:: echo config is %config%

echo %config% > settings.json




