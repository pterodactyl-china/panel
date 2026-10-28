<?php

declare(strict_types=1);

namespace Pterodactyl\Exceptions;

use Exception;

class ManifestDoesNotExistException extends Exception
{
    public function __construct()
    {
        parent::__construct('前端资源尚未构建，请先运行 "npm run build:production"。');
    }
}
