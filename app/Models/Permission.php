<?php

declare(strict_types=1);

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Support\Collection;

#[Guarded(['id', 'created_at', 'updated_at'])]
#[WithoutTimestamps]
class Permission extends Model
{
    public const string RESOURCE_NAME = 'subuser_permission';

    /**
     * All the permissions available on the system. You should use self::permissions()
     * to retrieve them, and not directly access this array as it is subject to change.
     *
     * @see Permission::permissions()
     *
     * @var array<string, array{description: string, keys: array<string, string>}>
     */
    protected static array $permissions = [
        'websocket' => [
            'description' => '允许用户连接服务器 WebSocket，从而查看控制台输出与实时资源占用。',
            'keys' => [
                'connect' => '允许用户连接服务器的 WebSocket，以实时接收控制台输出。',
            ],
        ],

        'control' => [
            'description' => '控制用户对服务器电源状态与命令发送的权限。',
            'keys' => [
                'console' => '允许用户通过控制台向服务器发送命令。',
                'start' => '允许用户在服务器停止时启动它。',
                'stop' => '允许用户停止正在运行的服务器。',
                'restart' => '允许用户重启服务器。重启可在服务器离线时启动它，但不会让服务器进入完全停止状态。',
            ],
        ],

        'user' => [
            'description' => '允许用户管理服务器上的其他子用户。他们永远无法编辑自己的账户，也无法授予自己不具备的权限。',
            'keys' => [
                'create' => '允许用户为服务器创建新的子用户。',
                'read' => '允许用户查看服务器上的子用户及其权限。',
                'update' => '允许用户修改其他子用户。',
                'delete' => '允许用户从服务器上删除子用户。',
            ],
        ],

        'file' => [
            'description' => '控制用户修改此服务器文件系统的权限。',
            'keys' => [
                'create' => '允许用户通过面板创建文件与文件夹。上传文件、拉取远程文件与解压压缩包还需要「更新」权限。',
                'read' => '允许用户查看目录内容，但不能查看或下载文件内容。',
                'read-content' => '允许用户查看指定文件的内容，同时也能下载文件。',
                'update' => '允许用户更新已有文件或目录的内容。',
                'delete' => '允许用户删除文件或目录。',
                'archive' => '允许用户打包目录内容，以及解压系统中已有的压缩包。',
                'sftp' => '允许用户通过 SFTP 连接，并使用已分配的文件权限管理服务器文件。',
            ],
        ],

        'backup' => [
            'description' => '控制用户生成与管理服务器备份的权限。',
            'keys' => [
                'create' => '允许用户为此服务器创建备份。',
                'read' => '允许用户查看此服务器的所有备份。',
                'delete' => '允许用户从系统中删除备份。',
                'download' => '允许用户下载服务器备份。危险：这会使用户可以访问备份中的全部服务器文件。',
                'restore' => '允许用户恢复服务器备份。危险：恢复过程中会删除服务器上的所有文件。',
            ],
        ],

        // Controls permissions for editing or viewing a server's allocations.
        'allocation' => [
            'description' => '控制用户修改此服务器端口分配的权限。',
            'keys' => [
                'read' => '允许用户查看当前分配给此服务器的全部端口。任何能访问此服务器的用户都可以查看主分配。',
                'create' => '允许用户为服务器分配额外端口。',
                'update' => '允许用户更改服务器的主分配，并为每个分配添加备注。',
                'delete' => '允许用户从服务器上删除分配。',
            ],
        ],

        // Controls permissions for editing or viewing a server's startup parameters.
        'startup' => [
            'description' => '控制用户查看此服务器启动参数的权限。',
            'keys' => [
                'read' => '允许用户查看服务器的启动变量。',
                'update' => '允许用户修改服务器的启动变量。',
                'docker-image' => '允许用户修改运行服务器时使用的 Docker 镜像。',
            ],
        ],

        'database' => [
            'description' => '控制用户访问此服务器数据库管理的权限。',
            'keys' => [
                'create' => '允许用户为此服务器创建数据库。',
                'read' => '允许用户查看此服务器关联的数据库。',
                'update' => '允许用户重置数据库实例的密码。若用户没有「查看密码」权限，将看不到更新后的密码。',
                'delete' => '允许用户从此服务器移除数据库实例。',
                'view_password' => '允许用户查看此服务器数据库实例的密码。',
            ],
        ],

        'schedule' => [
            'description' => '控制用户访问此服务器计划任务管理的权限。',
            'keys' => [
                'create' => '允许用户为此服务器创建计划任务。', // task.create-schedule
                'read' => '允许用户查看此服务器的计划任务及其下的任务。', // task.view-schedule, task.list-schedules
                'update' => '允许用户更新此服务器的计划任务与任务。', // task.edit-schedule, task.queue-schedule, task.toggle-schedule
                'delete' => '允许用户删除此服务器的计划任务。', // task.delete-schedule
            ],
        ],

        'settings' => [
            'description' => '控制用户访问此服务器设置的权限。',
            'keys' => [
                'rename' => '允许用户重命名服务器并修改其描述。',
                'reinstall' => '允许用户触发服务器重装。',
            ],
        ],

        'activity' => [
            'description' => '控制用户访问服务器活动日志的权限。',
            'keys' => [
                'read' => '允许用户查看服务器活动日志。',
            ],
        ],
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subuser_id' => 'integer',
        ];
    }

    /**
     * @return Collection<string, array{description: string, keys: array<string, string>}>
     */
    public static function permissions(): Collection
    {
        return Collection::make(self::$permissions);
    }
}
