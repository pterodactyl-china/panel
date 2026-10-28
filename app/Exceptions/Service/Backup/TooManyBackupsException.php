<?php

declare(strict_types=1);

namespace Pterodactyl\Exceptions\Service\Backup;

use Pterodactyl\Exceptions\DisplayException;

class TooManyBackupsException extends DisplayException
{
    /**
     * TooManyBackupsException constructor.
     */
    public function __construct(int $backupLimit)
    {
        parent::__construct(
            sprintf('无法创建新备份，此服务器已达到 %d 个备份的上限。', $backupLimit)
        );
    }
}
