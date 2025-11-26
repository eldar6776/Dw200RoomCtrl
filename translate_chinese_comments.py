#!/usr/bin/env python3
"""
Chinese to English Comment Translator for dxmodules

This script automatically finds and translates all Chinese text in JavaScript comments
within the dxmodules folder to English.

Usage:
    python translate_chinese_comments.py

Requirements:
    pip install deep-translator
"""

import re
import os
from pathlib import Path
from deep_translator import GoogleTranslator

# Configuration
DXMODULES_PATH = Path(__file__).parent / "dxmodules"
BACKUP_SUFFIX = ".backup"
DRY_RUN = False  # Set to True to see what would be changed without modifying files

# Common Chinese-to-English translations (manual mapping for technical terms)
MANUAL_TRANSLATIONS = {
    "初始化": "initialize",
    "必填": "required",
    "非必填": "optional",
    "缺省": "default",
    "主题": "topic",
    "内容": "content",
    "消息": "message",
    "客户端": "client",
    "服务地址": "server address",
    "用户名": "username",
    "密码": "password",
    "句柄": "handle",
    "实例": "instance",
    "连接": "connect/connection",
    "重新连接": "reconnect",
    "网络": "network",
    "断开": "disconnect",
    "订阅": "subscribe",
    "发送": "send",
    "接收": "receive",
    "判断": "check/determine",
    "查询": "query",
    "配置": "configuration/config",
    "更新": "update",
    "参数": "parameter",
    "失败": "failed",
    "成功": "success",
    "格式": "format",
    "错误": "error",
    "销毁": "destroy",
    "简单": "simple",
    "方式": "method/way",
    "函数": "function",
    "事件": "event",
    "状态": "status/state",
    "变化": "change",
    "轮询": "poll/polling",
    "获取": "get/obtain",
    "数据": "data",
    "请求": "request",
    "结构": "structure",
    "有数据": "has data",
    "没有数据": "no data",
    "遗嘱": "last will",
    "遗嘱主题": "last will topic",
    "遗嘱内容": "last will message",
    "遗嘱消息": "last will message",
    "设备": "device",
    "不同的设备": "different devices",
    "前缀": "prefix",
    "自动在主题前加上一个前缀": "automatically add a prefix to the topic",
    "消息最多发送一次": "message sent at most once",
    "发送后消息就被丢弃": "message discarded after sending",
    "消息至少发送一次": "message sent at least once",
    "可以保证消息被接收方收到": "ensures message is received",
    "但是会存在接收方收到重复消息的情况": "but duplicate messages may be received",
    "消息发送成功且只发送一次": "message sent successfully exactly once",
    "资源开销大": "high resource overhead",
    "通过broker通信的时候设备断开会自动触发一个mqtt遗嘱消息": "when device disconnects from broker, an MQTT last will message is automatically triggered",
    "这个是遗嘱消息的主题": "this is the last will message topic",
    "这个是遗嘱消息的内容": "this is the last will message content",
    "若初始化多个实例需要传入唯一id": "if initializing multiple instances, pass a unique id",
    "需保持和init中的id一致": "must match the id in init",
    "比如连接成功后突然网络断开": "for example, if network suddenly disconnects after successful connection",
    "无需重新init": "no need to re-init",
    "直接重连即可": "just reconnect directly",
    "要订阅的主题数组": "array of topics to subscribe to",
    "可以同时订阅多个": "can subscribe to multiple simultaneously",
    "连接成功后如果网络断开": "if network disconnects after successful connection",
    "连接也会断开": "connection will also be disconnected",
    "一般先判断有数据后再调用receive去获取数据": "typically check for data first, then call receive to get data",
    "只需要调用这一个函数就可以实现mqtt客户端": "just call this one function to implement MQTT client",
    "收到消息会触发给 dxEventBus发送一个事件": "receiving a message triggers an event to dxEventBus",
    "如果需要发送消息": "if you need to send a message",
    "直接使用 mqtt.send方法": "directly use the mqtt.send method",
    "mqtt发送的数据格式类似": "MQTT send data format is similar to",
    "mqtt的连接状态发生变化会触发给 dxEventBus发送一个事件": "when MQTT connection status changes, an event is triggered to dxEventBus",
    "mqtt需要有网络": "MQTT requires network",
    "所以必须在使用之前确保dxNet组件完成初始化": "so must ensure dxNet component is initialized before use",
    "请在worker里使用dxMqtt组件或使用简化函数": "please use dxMqtt component in worker or use simplified function",
    "以tcp://开头": "starts with tcp://",
    "格式是": "format is",
    "大部分可以用默认值": "most can use default values",
}


def contains_chinese(text):
    """Check if text contains Chinese characters"""
    return bool(re.search(r'[\u4e00-\u9fff]+', text))


def translate_text(text):
    """Translate Chinese text to English using manual mappings or Google Translate"""
    if not contains_chinese(text):
        return text
    
    # Try manual translation first
    for chinese, english in MANUAL_TRANSLATIONS.items():
        if chinese in text:
            text = text.replace(chinese, english)
    
    # If still contains Chinese, use Google Translate
    if contains_chinese(text):
        try:
            translator = GoogleTranslator(source='zh-CN', target='en')
            text = translator.translate(text)
        except Exception as e:
            print(f"Translation error: {e}")
    
    return text


def process_file(file_path):
    """Process a single JavaScript file and translate Chinese comments"""
    print(f"\nProcessing: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return
    
    original_content = content
    changes_made = 0
    
    # Pattern 1: Single-line comments with Chinese
    def replace_single_comment(match):
        nonlocal changes_made
        indent = match.group(1)
        comment_marker = match.group(2)
        comment_text = match.group(3)
        
        if contains_chinese(comment_text):
            translated = translate_text(comment_text)
            changes_made += 1
            print(f"  [{changes_made}] {comment_text[:50]}... -> {translated[:50]}...")
            return f"{indent}{comment_marker} {translated}"
        return match.group(0)
    
    # Replace single-line comments
    content = re.sub(
        r'^(\s*)(//|/\*\*?|\*)(.*)$',
        replace_single_comment,
        content,
        flags=re.MULTILINE
    )
    
    # Pattern 2: JSDoc @param and @returns with Chinese
    def replace_jsdoc_param(match):
        nonlocal changes_made
        indent = match.group(1)
        param_type = match.group(2)
        param_name = match.group(3) if match.group(3) else ""
        description = match.group(4)
        
        if contains_chinese(description):
            translated = translate_text(description)
            changes_made += 1
            print(f"  [{changes_made}] @{param_type} {description[:40]}... -> {translated[:40]}...")
            return f"{indent}@{param_type}{param_name} {translated}"
        return match.group(0)
    
    # Replace @param, @returns, @return descriptions
    content = re.sub(
        r'^(\s+\*\s*@)(param|returns?|brief|details|description)(\s+\{[^}]+\}\s+\w+)?\s+(.+)$',
        replace_jsdoc_param,
        content,
        flags=re.MULTILINE
    )
    
    if changes_made > 0:
        if not DRY_RUN:
            # Create backup
            backup_path = str(file_path) + BACKUP_SUFFIX
            if not os.path.exists(backup_path):
                with open(backup_path, 'w', encoding='utf-8') as f:
                    f.write(original_content)
                print(f"  Backup created: {backup_path}")
            
            # Write translated content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✓ Saved {changes_made} translations")
        else:
            print(f"  [DRY RUN] Would save {changes_made} translations")
    else:
        print("  No Chinese text found")


def main():
    """Main function to process all JavaScript files in dxmodules"""
    print("=" * 70)
    print("Chinese to English Comment Translator for dxmodules")
    print("=" * 70)
    
    if DRY_RUN:
        print("\n*** DRY RUN MODE - No files will be modified ***\n")
    
    if not DXMODULES_PATH.exists():
        print(f"Error: dxmodules folder not found at {DXMODULES_PATH}")
        return
    
    # Find all .js files in dxmodules
    js_files = list(DXMODULES_PATH.glob("*.js"))
    
    if not js_files:
        print("No JavaScript files found in dxmodules folder")
        return
    
    print(f"\nFound {len(js_files)} JavaScript files")
    
    total_files_changed = 0
    for js_file in sorted(js_files):
        original_size = js_file.stat().st_size
        process_file(js_file)
        
        if not DRY_RUN and js_file.stat().st_size != original_size:
            total_files_changed += 1
    
    print("\n" + "=" * 70)
    if DRY_RUN:
        print(f"DRY RUN COMPLETE - Would modify {total_files_changed} files")
    else:
        print(f"TRANSLATION COMPLETE")
        print(f"Files modified: {total_files_changed}")
        print(f"Backups saved with '{BACKUP_SUFFIX}' extension")
    print("=" * 70)


if __name__ == "__main__":
    main()
