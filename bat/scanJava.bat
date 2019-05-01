SET compressedAbsFile=%1
SET scanDir=%2

7z x %compressedAbsFile% -o%scanDir% -y

sourceanalyzer -b test clean
sourceanalyzer -b test %scanDir% -exclude %compressedAbsFile%
sourceanalyzer -b test -scan -f test.fpr
ReportGenerator -format pdf -f test.pdf -source test.fpr -template cib_low_whitelist.xml
