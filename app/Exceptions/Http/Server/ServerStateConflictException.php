<?php

declare(strict_types=1);

namespace Pterodactyl\Exceptions\Http\Server;

use Pterodactyl\Models\Server;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Throwable;

class ServerStateConflictException extends ConflictHttpException
{
    /**
     * Exception thrown when the server is in an unsupported state for API access or
     * certain operations within the codebase.
     */
    public function __construct(Server $server, ?Throwable $previous = null)
    {
        $message = '此服务器当前处于不受支持的状态，请稍后重试。';
        if ($server->isSuspended()) {
            $message = '此服务器已被暂停，所请求的功能不可用。';
        } elseif ($server->node->isUnderMaintenance()) {
            $message = '此服务器所在节点正在维护，所请求的功能不可用。';
        } elseif (! $server->isInstalled()) {
            $message = '此服务器尚未完成安装，请稍后重试。';
        } elseif ($server->status === Server::STATUS_RESTORING_BACKUP) {
            $message = '此服务器正在从备份恢复，请稍后重试。';
        } elseif (($server->transfer) !== null) {
            $message = '此服务器正在迁移到新机器，请稍后重试。';
        }

        parent::__construct($message, $previous);
    }
}
