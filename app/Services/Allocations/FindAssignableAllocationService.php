<?php

namespace Pterodactyl\Services\Allocations;

use Webmozart\Assert\Assert;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Exceptions\Service\Allocation\AutoAllocationNotEnabledException;
use Pterodactyl\Exceptions\Service\Allocation\NoAutoAllocationSpaceAvailableException;

class FindAssignableAllocationService
{
    /**
     * FindAssignableAllocationService constructor.
     */
    public function __construct(private AssignmentService $service)
    {
    }

    /**
     * Finds an existing unassigned allocation and attempts to assign it to the given server. If
     * no allocation can be found, a new one will be created with a random port between the defined
     * range from the configuration.
     *
     * @throws \Pterodactyl\Exceptions\DisplayException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\CidrOutOfRangeException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\InvalidPortMappingException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\PortOutOfRangeException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\TooManyPortsInRangeException
     */
    public function handle(Server $server): Allocation
    {
        if (!config('pterodactyl.client_features.allocations.enabled')) {
            throw new AutoAllocationNotEnabledException();
        }

        // Attempt to find a given available allocation for a server. If one cannot be found
        // we will fall back to attempting to create a new allocation that can be used for the
        // server.
        /** @var Allocation|null $allocation */
        $allocation = $server->node->allocations()
            ->lockForUpdate()
            ->where('ip', $server->allocation->ip)
            ->whereNull('server_id')
            ->inRandomOrder()
            ->first();

        $allocation = $allocation ?? $this->createNewAllocation($server);

        $allocation->update(['server_id' => $server->id]);

        return $allocation->refresh();
    }

    /**
     * 从节点已创建的未分配 allocation 记录中，找出一段连续的端口并分配给服务器。
     * 绝不创建新的 allocation 记录：只有预先创建好的端口（已存在于数据库中）才允许
     * 分配，因为服务器可能依赖为这些端口配置的安全组/防火墙，创建全新端口会绕过
     * 安全组导致服务器无法访问。
     *
     * @return Allocation[]
     *
     * @throws AutoAllocationNotEnabledException
     * @throws NoAutoAllocationSpaceAvailableException
     */
    public function handleConsecutive(Server $server, int $count): array
    {
        if (!config('pterodactyl.client_features.allocations.enabled')) {
            throw new AutoAllocationNotEnabledException();
        }

        $start = config('pterodactyl.client_features.allocations.range_start', null);
        $end = config('pterodactyl.client_features.allocations.range_end', null);

        if (!$start || !$end) {
            throw new NoAutoAllocationSpaceAvailableException();
        }

        Assert::integerish($start);
        Assert::integerish($end);

        $ip = $server->allocation->ip;

        // 只从节点上已经创建的未分配 allocation 记录中挑选连续端口。这些端口已包含在
        // 服务器的安全组/防火墙规则中，绝不能为凑数创建全新端口，否则会绕过安全组导致
        // 服务器无法访问。
        $unassigned = $server->node->allocations()
            ->where('ip', $ip)
            ->whereBetween('port', [$start, $end])
            ->whereNull('server_id')
            ->orderBy('port')
            ->pluck('port')
            ->toArray();

        // 在已创建的未分配端口中随机挑选一个能够容纳 $count 个连续端口的起始位置。
        $consecutiveStart = $this->findConsecutiveBlock($unassigned, $count);

        if ($consecutiveStart === null) {
            throw new NoAutoAllocationSpaceAvailableException('无法分配更多端口：节点上没有可用空间。');
        }

        return $this->assignConsecutivePorts($server, $ip, $consecutiveStart, $count);
    }

    /**
     * 将一段连续端口的 allocation 记录绑定到服务器。块内端口均为已创建的未分配记录，
     * 统一按端口查询后分配给服务器。
     *
     * @return Allocation[]
     */
    private function assignConsecutivePorts(Server $server, string $ip, int $start, int $count): array
    {
        $ports = range($start, $start + $count - 1);

        $allocations = $server->node->allocations()
            ->where('ip', $ip)
            ->whereIn('port', $ports)
            ->whereNull('server_id')
            ->get();

        if ($allocations->count() !== $count) {
            throw new NoAutoAllocationSpaceAvailableException('无法分配更多端口：节点上没有可用空间。');
        }

        $allocations->each(function (Allocation $allocation) use ($server) {
            $allocation->update(['server_id' => $server->id]);
        });

        return $allocations->map(fn (Allocation $a) => $a->refresh())->all();
    }

    /**
     * 在端口数组中查找所有能够容纳 count 个连续端口的起始位置，并随机返回其中一个。
     *
     * @param int[] $ports 已排序的端口数组
     * @param int $count 需要的连续端口数量
     *
     * @return int|null 连续块的起始端口，如果没有找到则返回 null
     */
    private function findConsecutiveBlock(array $ports, int $count): ?int
    {
        $portSet = array_flip($ports);
        $candidates = [];

        foreach ($ports as $candidate) {
            $valid = true;
            for ($j = 1; $j < $count; ++$j) {
                if (!isset($portSet[$candidate + $j])) {
                    $valid = false;
                    break;
                }
            }
            if ($valid) {
                $candidates[] = $candidate;
            }
        }

        if (empty($candidates)) {
            return null;
        }

        return $candidates[array_rand($candidates)];
    }

    /**
     * Create a new allocation on the server's node with a random port from the defined range
     * in the settings. If there are no matches in that range, or something is wrong with the
     * range information provided an exception will be raised.
     *
     * @throws \Pterodactyl\Exceptions\DisplayException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\CidrOutOfRangeException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\InvalidPortMappingException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\PortOutOfRangeException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\TooManyPortsInRangeException
     */
    protected function createNewAllocation(Server $server): Allocation
    {
        $start = config('pterodactyl.client_features.allocations.range_start', null);
        $end = config('pterodactyl.client_features.allocations.range_end', null);

        if (!$start || !$end) {
            throw new NoAutoAllocationSpaceAvailableException();
        }

        Assert::integerish($start);
        Assert::integerish($end);

        // Get all of the currently allocated ports for the node so that we can figure out
        // which port might be available.
        $ports = $server->node->allocations()
            ->where('ip', $server->allocation->ip)
            ->whereBetween('port', [$start, $end])
            ->pluck('port');

        // Compute the difference of the range and the currently created ports, finding
        // any port that does not already exist in the database. We will then use this
        // array of ports to create a new allocation to assign to the server.
        $available = array_diff(range($start, $end), $ports->toArray());

        // If we've already allocated all of the ports, just abort.
        if (empty($available)) {
            throw new NoAutoAllocationSpaceAvailableException();
        }

        // Pick a random port out of the remaining available ports.
        /** @var int $port */
        $port = $available[array_rand($available)];

        $this->service->handle($server->node, [
            'allocation_ip' => $server->allocation->ip,
            'allocation_ports' => [$port],
        ]);

        /** @var Allocation $allocation */
        $allocation = $server->node->allocations()
            ->lockForUpdate()
            ->where('ip', $server->allocation->ip)
            ->where('port', $port)
            ->firstOrFail();

        return $allocation;
    }
}
