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

/**
 * Contains all of the translation strings for different activity log
 * events. These should be keyed by the value in front of the colon (:)
 * in the event name. If there is no colon present, they should live at
 * the top level.
 */
return [
    'auth' => [
        'fail' => '登录失败',
        'success' => '已登入',
        'password-reset' => '重设密码',
        'reset-password' => '请求密码重置',
        'checkpoint' => '请求动态口令认证',
        'recovery-token' => '使用了动态口令恢复代码',
        'token' => '正确输入了动态口令',
        'ip-blocked' => '已阻止来自未在白名单中的 IP 地址的请求（:identifier）',
        'sftp' => [
            'fail' => 'SFTP 登录失败',
        ],
    ],
    'user' => [
        'user' => [
            'create' => '创建了新用户 :email',
        ],
        'account' => [
            'email-changed' => '已将电子邮箱从 :old 更改为 :new',
            'password-changed' => '已更改密码',
        ],
        'api-key' => [
            'create' => '创建新的 API 密钥 :identifier',
            'delete' => '已删除 API 密钥 :identifier',
        ],
        'ssh-key' => [
            'create' => '将 SSH 私钥 :fingerprint 添加到帐户',
            'delete' => '从帐户中删除了 SSH 私钥 :fingerprint',
        ],
        'two-factor' => [
            'create' => '启用动态口令认证',
            'delete' => '禁用动态口令认证',
        ],
    ],
    'server' => [
        'reinstall' => '重装服务器',
        'console' => [
            'command' => '在服务器上执行 ":command"',
        ],
        'power' => [
            'start' => '启动了服务器',
            'stop' => '停止了服务器',
            'restart' => '重启了服务器',
            'kill' => '强制停止了服务器',
        ],
        'backup' => [
            'download' => '下载了 :name 备份',
            'delete' => '删除了 :name 备份',
            'restore' => '恢复了 :name 备份 (已删除文件: :truncate)',
            'restore-complete' => '已成功恢复 :name 备份',
            'restore-failed' => ':name 备份恢复失败',
            'start' => ':name 开始了新的一轮备份',
            'complete' => '已将 :name 备份标记为完成',
            'fail' => '已将 :name 备份标记为失败',
            'lock' => '锁定了 :name 备份',
            'unlock' => '解锁了 :name 备份',
        ],
        'database' => [
            'create' => '创建新数据库 :name',
            'rotate-password' => '为数据库 :name 轮换密码',
            'delete' => '已删除数据库 :name',
        ],
        'file' => [
            'compress_one' => '压缩了 :directory:files.0',
            'compress_other' => '在 :directory 路径下压缩了 :count 个文件',
            'chmod_one' => '将 :directory:files.0.file 的权限修改为 :files.0.mode',
            'chmod_other' => '修改了 :directory 目录下 :count 个文件的权限',
            'read' => '查看了 :file 的内容',
            'copy' => '创建了 :file 的副本',
            'create-directory' => '已创建目录 :directory:name',
            'decompress' => '解压了 :directory 路径下的 :files',
            'delete_one' => '删除了 :directory:files.0',
            'delete_other' => '删除了 :directory 路径下的 :count 个文件',
            'download' => '下载 :file',
            'pull' => '从 :url 下载远程文件到 :directory 路径下',
            'rename_one' => '将 :directory:files.0.from 重命名为 :directory:files.0.to',
            'rename_other' => '在 :directory 路径下重命名了 :count 个文件',
            'write' => '写了一些新内容到 :file 中',
            'upload' => '上传了一些文件',
            'uploaded' => '已上传 :directory:file',
        ],
        'sftp' => [
            'denied' => '由于权限原因阻止了 SFTP 访问',
            'create_one' => '创建了 :files.0',
            'create_other' => '创建了新的 :count 文件',
            'write_one' => '修改了 :files.0 的内容',
            'write_other' => '修改了 :count 文件的内容',
            'delete_one' => '删除了 :files.0',
            'delete_other' => '删除了 :count 文件',
            'create-directory_one' => '创建了 :files.0 目录',
            'create-directory_other' => '创建了 :count 个目录',
            'rename_one' => '将 :files.0.from 重命名为 :files.0.to',
            'rename_other' => '重命名或移动了 :count 个文件',
        ],
        'allocation' => [
            'create' => '添加 :allocation 到服务器',
            'notes' => '将 :allocation 的备注从 ":old" 更新为 ":new"',
            'primary' => '将 :allocation 设置为服务器首选',
            'delete' => '删除了 :allocation 分配',
        ],
        'schedule' => [
            'create' => '创建了 :name 计划',
            'update' => '更新了 :name 计划',
            'execute' => '手动执行了 :name 计划',
            'delete' => '删除了 :name 计划',
        ],
        'task' => [
            'create' => '为 :name 计划创建了一个新的 ":action" 任务',
            'update' => '更新了 :name 计划的 ":action" 任务',
            'delete' => '删除了 :name 计划的一个任务',
        ],
        'settings' => [
            'rename' => '将服务器从 :old 重命名为 :new',
            'description' => '将服务器描述从 :old 更改为 :new',
        ],
        'startup' => [
            'edit' => '将 :variable 变量从 ":old" 更改为 ":new"',
            'image' => '将服务器的 Docker 映像从 :old 更新为 :new',
        ],
        'subuser' => [
            'create' => '将 :email 添加为子用户',
            'update' => '更新了 :email 的子用户权限',
            'delete' => '将 :email 从子用户中删除',
        ],
    ],
    'admin' => [
        'api-key' => [
            'create' => '创建了应用 API 密钥 :identifier',
            'update' => '更新了应用 API 密钥 :identifier',
            'delete' => '删除了应用 API 密钥 :identifier',
        ],
        'database-host' => [
            'create' => '创建了数据库主机 :name',
            'update' => '更新了数据库主机 :name',
            'delete' => '删除了数据库主机 :name',
        ],
        'egg' => [
            'create' => '创建了预设 :name',
            'update' => '更新了预设 :name',
            'delete' => '删除了预设 :name',
            'import' => '导入了预设 :name',
            'update-import' => '通过导入更新了预设 :name',
            'scripts' => '更新了预设 :name 的安装脚本',
            'tags' => '更新了预设的标签',
            'tags_one' => '将预设标签设置为 :tags.0',
            'tags_other' => '为预设设置了 :count 个标签',
        ],
        'egg-variable' => [
            'create' => '创建了预设变量 :name',
            'update' => '更新了预设变量 :name',
            'delete' => '删除了预设变量 :name',
            'reorder' => '重新排序了预设的变量',
        ],
        'location' => [
            'create' => '创建了地域 :short',
            'update' => '更新了地域 :short',
            'delete' => '删除了地域 :short',
        ],
        'mount' => [
            'create' => '创建了挂载 :name',
            'update' => '更新了挂载 :name',
            'delete' => '删除了挂载 :name',
            'attach-egg' => '将挂载关联到预设 :eggs',
            'attach-egg_one' => '将预设关联到此挂载',
            'attach-egg_other' => '将 :count 个预设关联到此挂载',
            'detach-egg' => '解除了挂载与预设 :egg 的关联',
            'attach-node' => '将挂载关联到节点 :nodes',
            'attach-node_one' => '将节点关联到此挂载',
            'attach-node_other' => '将 :count 个节点关联到此挂载',
            'detach-node' => '解除了挂载与节点 :node 的关联',
        ],
        'node' => [
            'create' => '创建了节点 :name',
            'update' => '更新了节点 :name',
            'delete' => '删除了节点 :name',
            'deploy-token' => '为节点 :name 生成了部署令牌',
            'tags' => '更新了节点的预设标签',
            'tags_one' => '将节点标签设置为 :tags.0',
            'tags_other' => '为节点设置了 :count 个标签',
            'deployment-tags' => '更新了节点的部署标签',
            'deployment-tags_one' => '将节点部署标签设置为 :tags.0',
            'deployment-tags_other' => '为节点设置了 :count 个部署标签',
        ],
        'node-allocation' => [
            'create' => '在节点的 :address_count 个地址上添加了 :ports_count 个端口',
            'alias' => '将分配别名设置为 :alias',
            'delete' => '删除了 :address 上的端口 :port',
            'delete-block' => '删除了 :address 上未分配的分配',
        ],
        'server' => [
            'create' => '创建了服务器 :name',
            'delete' => '删除了服务器 :name',
            'details' => '更新了 :name 的详细信息',
            'build' => '更新了 :name 的构建配置',
            'startup' => '更新了 :name 的启动配置',
            'reinstall' => '重装了 :name',
            'rebuild' => '触发了 :name 的重建',
            'suspend' => '冻结了 :name',
            'unsuspend' => '解冻了 :name',
            'toggle-install' => '切换了 :name 的安装状态',
            'transfer' => '开始将 :name 转移到节点 :node_id',
            'mount' => '为服务器添加了挂载 :name',
            'unmount' => '从服务器移除了挂载 :name',
        ],
        'server-backup' => [
            'toggle-lock' => '切换了备份 :name 的锁定状态',
        ],
        'server-database' => [
            'create' => '创建了数据库 :name',
            'delete' => '删除了数据库 :name',
            'rotate-password' => '轮换了数据库 :name 的密码',
        ],
        'tag' => [
            'create' => '创建了标签 :slug',
            'update' => '更新了标签 :slug',
            'delete' => '删除了标签 :slug',
        ],
        'theme' => [
            'activate' => '激活了主题 :theme',
            'reset' => '将面板重置为经典主题',
            'settings' => '更新了主题 :theme 的设置',
            'image' => '上传了主题 :theme 的 :setting 图片',
            'image-clear' => '移除了主题 :theme 的 :setting 图片',
        ],
        'user' => [
            'create' => '创建了用户 :email',
            'update' => '更新了用户 :email',
            'delete' => '删除了用户 :email',
            'disable-2fa' => '为 :email 禁用了动态口令认证',
        ],
    ],
];
