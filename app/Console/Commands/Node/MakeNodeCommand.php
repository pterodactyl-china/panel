<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Node;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Validation\ValidationException;
use Pterodactyl\Contracts\Nodes\CreatesNodes;

#[Description('通过命令行在系统中创建新节点。')]
#[Signature('p:node:make
                            {--name= : 用于标识节点的名称。}
                            {--description= : 用于标识节点的描述。}
                            {--locationId= : 有效的地域 ID。}
                            {--fqdn= : 用于连接守护进程的域名（例如 node.example.com）。仅当该节点未使用 SSL 时才可使用 IP 地址。}
                            {--public= : 节点是否公开？（公开=1 / 私有=0）。}
                            {--scheme= : 使用哪种协议？（启用 SSL=https / 禁用 SSL=http）。}
                            {--proxy= : 守护进程是否位于代理之后？（是=1 / 否=0）。}
                            {--maintenance= : 是否启用维护模式？ (Enable Maintenance mode=1 / Disable Maintenance mode=0).}
                            {--maxMemory= : 设置最大内存容量。}
                            {--overallocateMemory= : 内存超额分配量（百分比，或 -1 表示最大超额）。}
                            {--maxDisk= : 设置最大磁盘容量。}
                            {--overallocateDisk= : 磁盘超额分配量（百分比，或 -1 表示最大超额）。}
                            {--uploadSize= : 最大上传文件大小。}
                            {--daemonListeningPort= : 请输入 Wings 监听端口.}
                            {--daemonSFTPPort= : 请输入 Wings SFTP 监听端口.}
                            {--daemonBase= : 请输入基础目录.}')]
class MakeNodeCommand extends Command
{
    /**
     * Handle the command execution process.
     */
    public function handle(CreatesNodes $nodes): int
    {
        $input = [
            'name' => $this->option('name') ?? $this->ask('请输入用于区分该节点与其他节点的简短标识'),
            'description' => $this->option('description') ?? $this->ask('请输入用于标识该节点的描述'),
            'location_id' => $this->option('locationId') ?? $this->ask('请输入有效的地域 ID'),
            'scheme' => $this->option('scheme') ?? $this->anticipate(
                '使用 SSL 请输入 https，否则输入 http',
                ['https', 'http'],
                'https'
            ),
            'fqdn' => $this->option('fqdn') ?? $this->ask('请输入用于连接守护进程的域名（例如 node.example.com）。仅当此节点未使用 SSL 时才可使用 IP 地址'),
            'public' => $this->option('public') ?? $this->confirm('此节点是否公开？注意：设为私有后将无法自动部署到此节点。', true),
            'behind_proxy' => $this->option('proxy') ?? $this->confirm('您的 FQDN 是否位于代理之后？'),
            'maintenance_mode' => $this->option('maintenance') ?? $this->confirm('是否启用维护模式？'),
            'memory' => $this->option('maxMemory') ?? $this->ask('请输入最大内存容量'),
            'memory_overallocate' => $this->option('overallocateMemory') ?? $this->ask('请输入内存超额分配量：-1 表示不检查，0 表示禁止创建新服务器'),
            'disk' => $this->option('maxDisk') ?? $this->ask('请输入最大磁盘空间'),
            'disk_overallocate' => $this->option('overallocateDisk') ?? $this->ask('请输入磁盘超额分配量：-1 表示不检查，0 表示禁止创建新服务器'),
            'upload_size' => $this->option('uploadSize') ?? $this->ask('请输入最大上传文件大小', '100'),
            'daemon_listen' => $this->option('daemonListeningPort') ?? $this->ask('请输入 Wings 监听端口', '8080'),
            'daemon_sftp' => $this->option('daemonSFTPPort') ?? $this->ask('请输入 Wings SFTP 监听端口', '2022'),
            'daemon_base' => $this->option('daemonBase') ?? $this->ask('请输入基础目录', '/var/lib/pterodactyl/volumes'),
        ];

        try {
            $node = $nodes->create($input);
        } catch (ValidationException $validationException) {
            foreach ($validationException->validator->errors()->all() as $error) {
                $this->error($error);
            }

            return 1;
        }

        $this->line('已在以下地域成功创建新节点： '.$node->location_id.' 名称为 '.$node->name.' 其 ID 为 '.$node->id.'.');

        return 0;
    }
}
