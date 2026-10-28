<?php

declare(strict_types=1);

namespace Pterodactyl\Exceptions\Service\Database;

use Pterodactyl\Exceptions\DisplayException;

class TooManyDatabasesException extends DisplayException
{
    public function __construct()
    {
        parent::__construct('操作已中止：创建新数据库会使此服务器超出已定义的上限。');
    }
}
