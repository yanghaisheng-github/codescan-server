@echo off
title ScanJava
::背景颜色以及字体颜色，它的值由两位十六进制的数组成，前面一位指的是背景颜色，后面一位指的是字体颜色。
color 03
::窗口大小
mode con cols=40 lines=15


SET systemName=%1
SET compressedAbsFile=%2
SET scanDir=%3

echo %systemName%
echo %compressedAbsFile%
echo %scanDir%

7z x %compressedAbsFile% -o%scanDir% -y

sourceanalyzer -b %systemName% -clean
sourceanalyzer -b %systemName% %scanDir% -exclude %compressedAbsFile%
sourceanalyzer -b %systemName% -scan -f test.fpr
ReportGenerator -format pdf -f %systemName%.pdf -source %systemName%.fpr -template cib_low_whitelist.xml
