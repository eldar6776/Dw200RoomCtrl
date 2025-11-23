#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Chinese to English Comment Replacer
Automatically replaces Chinese comments with English in all JS files
"""

import os
import re

# Translation dictionary (Chinese → English)
translations = {
    # PWM/Buzzer
    "初始化蜂鸣": "Initialize buzzer/beeper",
    "按键音": "Button press sound",
    "失败音": "Fail sound",
    "成功音": "Success sound", 
    "警告音": "Warning sound",
    "按键音量": "Button sound volume (0-100)",
    "蜂鸣提示音量": "Buzzer volume (0-100)",
    
    # Network
    "关闭网络": "Disable network",
    
    # GPIO/Door
    "判断开门模式": "Check door open mode",
    "常闭不允许开": "Normally closed - opening not allowed",
    "正常模式记录关继电器的时间": "Normal mode - record relay close time",
    "定时关继电器": "Timed relay close",
    "常开不允许关": "Normally open - closing not allowed",
    "继电器开门": "Open door relay",
    "gpio 在关的情况在打开门磁代表非法开门上报": "GPIO closed but door sensor open - illegal entry detected",
    "记录开门超时时间": "Record door open timeout",
    "降低检查频率，间隔200毫秒检查一次": "Reduce check frequency - check every 200ms",
    
    # NFC/RFID
    "刷卡已关闭": "Card reading disabled",
    
    # Audio
    "语音播报音量": "Voice volume",
    "获取/设置音量，范围（[0,6]）": "Get/Set volume, range [0,6]",
    
    # Access Control
    "设备禁用不做任何通行": "Device disabled - no access allowed",
    "配置码": "Config code",
    "通行码": "Access code",
    "解析通行码": "Parse access code",
    "通行码校验失败": "Access code validation failed",
    "配置码校验失败": "Config code validation failed",
    
    # EID
    "云证激活": "EID activation",
    "云证激活成功": "EID activation successful",
    "云证激活失败": "EID activation failed",
    
    # UI/Screen
    "重新加载屏幕，对于ui配置生效的修改": "Reload screen for UI config changes",
    "在线核验中": "Online verification",
    "成功": "Success",
    "失败": "Failed",
    
    # BLE
    "生成蓝牙串口的校验字，和一般校验字计算不一样": "Generate BLE UART checksum (different from standard checksum)",
    "去掉index": "Remove index",
    "设置成功返回true": "Returns true on success",
    
    # Upgrade
    "开始升级": "Start upgrade",
    "升级包下载中": "Downloading upgrade package",
    "创建临时目录": "Create temp directory",
    "确保临时目录存在": "Ensure temp directory exists",
    "下载文件到临时目录": "Download file to temp directory",
    "升级包下载失败": "Upgrade package download failed",
    "升级包下载成功": "Upgrade package download successful",
    "无法打开源文件": "Cannot open source file",
    "文件复制失败": "File copy failed",
    "文件复制成功": "File copy successful",
    "蓝牙升级中": "BLE upgrade in progress",
    "已经进入升级模式，可以开始进行升级": "Entered upgrade mode, ready to upgrade",
    "进入升级模式失败": "Failed to enter upgrade mode",
    "发送升级包描述信息": "Send upgrade package description",
    "发送升级包描述信息成功，请发送升级包": "Upgrade description sent successfully, please send package",
    "发送升级包": "Send upgrade package",
    "计算当前分包的起始和结束位置": "Calculate current chunk start/end position",
    "防止越界": "Prevent overflow",
    "创建当前分包数据的 ArrayBuffer (关键步骤)": "Create ArrayBuffer for current chunk (critical step)",
    "最后一个分包，需要填充剩余字节": "Last chunk - fill remaining bytes",
    "最后一字节数据": "Last byte data",
    "升级包传输完毕": "Upgrade package transmission complete",
    "原数据信息已同步,正在分包传输": "Original data synced, transmitting in chunks",
    "升级包传输成功": "Upgrade package transmission successful",
    "升级包传输失败": "Upgrade package transmission failed",
    "发送升级结束指令": "Send upgrade end command",
    "升级结束指令成功": "Upgrade end command successful",
    "升级结束指令失败": "Upgrade end command failed",
    "发送安装指令": "Send install command",
    "升级成功": "Upgrade successful",
    "升级失败": "Upgrade failed",
    
    # File operations
    "移动到文件末尾": "Move to end of file",
    "获取当前位置（即文件大小）": "Get current position (file size)",
    "参数验证": "Parameter validation",
    "必须是整数": "Must be integer",
    "必须大于0": "Must be greater than 0",
    "暂不支持超过8字节的处理": "Does not support > 8 bytes yet",
    "数值范围检查": "Value range check",
    "数值超出": "Value exceeds",
    "字节范围": "byte range",
    "小端字节提取": "Little-endian byte extraction",
    "格式转换": "Format conversion",
    
    # Async/Sync
    "异步转同步小实现": "Simple async to sync implementation",
    
    # NTP
    "自动对时已关闭": "Auto time sync disabled",
    "定时同步，立即同步一次时间": "Scheduled sync - sync time immediately",
    "等过了这个小时再次允许对时": "Wait until next hour to allow sync again",
    
    # Watchdog
    "如果 sn 为空先用设备 uuid": "If SN empty, use device UUID first",
    "降低喂狗频率，间隔2秒喂一次": "Reduce watchdog feed frequency - every 2 seconds",
    
    # Auto restart
    "初始化为当前小时数，而不是0": "Initialize to current hour, not 0",
    "检查是否需要整点重启": "Check if hourly restart needed",
    "检查开始": "Check started",
    "只有当小时数等于设定值，且不是上次检查过的小时时才执行": "Execute only when hour matches setting and not last checked",
    "更新上次检查的小时数": "Update last checked hour",
    
    # Common
    "配置文件先初始化，因为后面的组件初始化中可能要用到配置文件": "Initialize config first - other components may need it",
    "只能在主线程开辟子线程": "Can only create worker threads in main thread",
    "如果存在代表升级os": "If exists, indicates OS upgrade",
    
    # UI text in quotes (preserve quotes)
    '"密码"': '"Password"',
    '"成功!"': '"Success!"',
    '"失败!"': '"Failed!"',
    '"欢迎使用"': '"Welcome"',
    '"确认"': '"Confirm"',
    '"取消"': '"Cancel"',
    '"删除"': '"Delete"',
    
    # Database/SQL
    "查询权限": "Query permission",
    "添加权限": "Add permission",
    "删除权限": "Delete permission",
    "更新权限": "Update permission",
    
    # MQTT
    "心跳": "Heartbeat",
    "连接": "Connection",
    "断开": "Disconnect",
}

def replace_chinese(content):
    """Replace Chinese text with English"""
    for chinese, english in translations.items():
        content = content.replace(chinese, english)
    return content

def process_file(filepath):
    """Process a single JS file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        content = replace_chinese(content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            print(f"✅ Updated: {filepath}")
            return True
        else:
            print(f"⏭️  No changes: {filepath}")
            return False
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        return False

def main():
    """Process all JS files in src directory"""
    src_dir = r"C:\ProjektiOtvoreni\dw200_hotel_access\src"
    
    updated_count = 0
    total_count = 0
    
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.js'):
                filepath = os.path.join(root, file)
                total_count += 1
                if process_file(filepath):
                    updated_count += 1
    
    print(f"\n{'='*60}")
    print(f"📊 Summary:")
    print(f"   Total JS files: {total_count}")
    print(f"   Updated files: {updated_count}")
    print(f"   Unchanged files: {total_count - updated_count}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
