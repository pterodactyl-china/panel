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
        'websocket_*' => '允许访问此服务器的 websocket。',
        'control_console' => '允许用户通过控制台向服务器实例发送命令。',
        'control_start' => '允许用户在服务器停止时启动它。',
        'control_stop' => '允许用户停止正在运行的服务器。',
        'control_restart' => '允许用户重新启动服务器实例。',
        'control_kill' => '允许用户强制停止服务器实例。',
        'user_create' => '允许用户为服务器创建新的子用户。',
        'user_read' => '允许用户查看与此服务器关联的子用户权限。',
        'user_update' => '允许用户修改与此服务器关联的子用户。',
        'user_delete' => '允许用户删除与此服务器关联的子用户。',
        'file_create' => '允许用户通过面板或直接上传、创建其他文件和文件夹。',
        'file_read' => '允许用户查看目录的内容，但不能查看或下载文件的内容。',
        'file_update' => '允许用户更新现有文件或目录的内容。',
        'file_delete' => '允许用户删除文件或目录。',
        'file_archive' => '允许用户打包目录内容，并解压已有的压缩包。',
        'file_sftp' => '允许用户使用其他分配的文件权限连接到 SFTP 并管理服务器文件。',
        'allocation_read' => '允许访问服务器端口管理页面。',
        'allocation_update' => '允许用户修改服务器端口的权限。',
        'database_create' => '允许用户为服务器创建新数据库的权限。',
        'database_read' => '允许用户查看服务器数据库的权限。',
        'database_update' => '控制用户修改此服务器数据库的权限。若用户没有「查看密码」权限，将看不到更新后的密码。',
        'database_delete' => '允许用户删除数据库实例的权限。',
        'database_view_password' => '允许用户在系统中查看数据库密码。',
        'schedule_create' => '允许用户为此服务器创建计划任务。',
        'schedule_read' => '允许用户查看此服务器的计划任务及其中包含的任务。',
        'schedule_update' => '允许用户更新此服务器的计划任务及其中的任务。',
        'schedule_delete' => '允许用户删除此服务器的计划任务。',
    ],
];
