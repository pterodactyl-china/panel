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
    'exceptions' => [
        'no_new_default_allocation' => '您正在试图删除此服务器的默认分配，但没有可供使用的备用分配。',
        'skipping_install_script' => '此服务器已配置为跳过其预设的安装脚本。在禁用该设置之前无法重新安装。',
        'marked_as_failed' => '由于该服务器之前被标记为安装失败。在此状态下无法切换当前状态。',
        'bad_variable' => ':name 变量存在验证错误。',
        'daemon_exception' => '与守护程序通信时出错，返回 HTTP :code。该异常已记录（请求 ID：:request_id）。',
        'default_allocation_not_found' => '在此服务器的分配中找不到所请求的默认分配。',
    ],
    'alerts' => [
        'startup_changed' => '该服务器的启动配置已经更新。如果此服务器的预设组或预设被更改，现在将进行重新安装。',
        'server_deleted' => '服务器已成功从系统中删除。',
        'server_created' => '服务器已在面板上成功创建。请允许守护进程用几分钟的时间来完成安装此服务器。',
        'build_updated' => '此服务器的构建配置已更新。某些更改可能需要重新启动才能生效。',
        'suspension_toggled' => '服务器已从冻结状态更改为 :status。',
        'rebuild_on_boot' => '该服务器已标记为需要 Docker 容器重建。这将在下次启动服务器时执行该操作。',
        'install_toggled' => '该服务器的安装状态已被切换。',
        'server_reinstalled' => '此服务器已进入等候队列，马上重新安装。',
        'details_updated' => '服务器详细信息已成功更新。',
        'docker_image_updated' => '已成功更改用于此服务器的默认 Docker 镜像。需要重新启动才能应用此更改。',
        'node_required' => '您必须至少配置一个节点，然后才能将服务器添加到此面板。',
        'transfer_nodes_required' => '您必须至少配置两个节点，然后才能转移服务器。',
        'transfer_started' => '服务器转移已开始。',
        'transfer_not_viable' => '您选择的节点没有足够的存储空间或内存来容纳此服务器。',
    ],
];
