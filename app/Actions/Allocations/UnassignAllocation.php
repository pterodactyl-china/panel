<?php

declare(strict_types=1);

namespace Pterodactyl\Actions\Allocations;

use Pterodactyl\Contracts\Allocations\UnassignsAllocations;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Models\Server;

final class UnassignAllocation implements UnassignsAllocations
{
    public function unassign(Server $server, Allocation $allocation): Allocation
    {
        throw_if(empty($server->allocation_limit), DisplayException::class, '无法删除此服务器的端口：未设置端口上限。');
        throw_if($allocation->id === $server->allocation_id, DisplayException::class, '无法删除此服务器的主分配端口。');

        Allocation::query()->where('id', $allocation->id)->update([
            'notes' => null,
            'server_id' => null,
        ]);

        Activity::event('server:allocation.delete')
            ->subject($server, $allocation)
            ->property('allocation', $allocation->toString())
            ->log();

        return $allocation->refresh();
    }
}
