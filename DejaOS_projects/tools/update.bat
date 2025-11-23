@echo off
echo Waiting for the application to exit...
:loop
tasklist /FI "IMAGENAME eq config_tool.exe" 2^>NUL | find /I /N "config_tool.exe"^>NUL
if "%ERRORLEVEL%"=="0" (
    timeout /t 1 /nobreak ^> NUL
    goto loop
)
copy /Y C:\Users\mzx\Desktop\设备工具\设备配置工具_JS\updater\tmp\config_tool.exe .\config_tool.exe
start config_tool.exe
del %0