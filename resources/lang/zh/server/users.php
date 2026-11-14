<?php

declare(strict_types=1);

/**
 * Pterodactyl CHINA - Panel
 * 简体中文语言包，翻译与维护：Pterodactyl China
 * Copyright (c) 2018 - 2026 ValiantShishu <vlssu@vlssu.com>.
 *
 * This software is licensed under the terms of the MIT license.
 * https://opensource.org/licenses/MIT
 */

return [
    'permissions' => [
        'websocket_*' => '允许用户连接此服务器的 WebSocket。',
        'control_console' => '允许用户通过控制台向服务器发送命令。',
        'control_start' => '允许用户在服务器停止后启动它。',
        'control_stop' => '允许用户停止正在运行的服务器。',
        'control_restart' => '允许用户重启服务器。',
        'control_kill' => '允许用户强制终止服务器进程。',
        'user_create' => '允许用户为此服务器创建子用户。',
        'user_read' => '允许用户查看此服务器的子用户。',
        'user_update' => '允许用户修改此服务器的子用户。',
        'user_delete' => '允许用户删除此服务器的子用户。',
        'file_create' => '允许用户创建新的文件和文件夹。',
        'file_read' => '允许用户查看此服务器的文件和文件夹，并浏览其中的内容。',
        'file_update' => '允许用户修改服务器上的文件和文件夹。',
        'file_delete' => '允许用户删除文件和文件夹。',
        'file_archive' => '允许用户创建压缩包，并解压已有的压缩包。',
        'file_sftp' => '允许用户通过 SFTP 客户端执行上述文件操作。',
        'allocation_read' => '允许用户访问服务器的端口（分配）管理页面。',
        'allocation_update' => '允许用户修改服务器的端口（分配）。',
        'database_create' => '允许用户为此服务器创建数据库。',
        'database_read' => '允许用户查看服务器的数据库。',
        'database_update' => '允许用户修改服务器的数据库；若同时没有「查看密码」权限，则无法修改数据库密码。',
        'database_delete' => '允许用户删除服务器的数据库。',
        'database_view_password' => '允许用户查看数据库密码。',
        'schedule_create' => '允许用户为此服务器创建计划任务。',
        'schedule_read' => '允许用户查看此服务器的计划任务。',
        'schedule_update' => '允许用户修改此服务器的计划任务。',
        'schedule_delete' => '允许用户删除此服务器的计划任务。',
    ],
];
