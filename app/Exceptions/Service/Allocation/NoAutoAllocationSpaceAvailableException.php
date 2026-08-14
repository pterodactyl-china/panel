<?php

namespace Pterodactyl\Exceptions\Service\Allocation;

use Pterodactyl\Exceptions\DisplayException;

class NoAutoAllocationSpaceAvailableException extends DisplayException
{
    /**
     * NoAutoAllocationSpaceAvailableException constructor.
     */
    public function __construct(?string $message = null)
    {
        parent::__construct(
            $message ?? '无法分配更多端口：节点上没有可用空间。'
        );
    }
}
