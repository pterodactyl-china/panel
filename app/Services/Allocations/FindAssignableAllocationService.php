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
            ->where('ip', $server->allocation->ip)
            ->whereNull('server_id')
            ->inRandomOrder()
            ->first();

        $allocation = $allocation ?? $this->createNewAllocation($server);

        $allocation->update(['server_id' => $server->id]);

        return $allocation->refresh();
    }

    /**
     * Finds or creates multiple consecutive unassigned allocations and assigns them to the given
     * server. Consecutive ports are preferred from existing unassigned allocations; if not enough
     * are available, new ones will be created from the configured range.
     *
     * @return Allocation[]
     *
     * @throws \Pterodactyl\Exceptions\DisplayException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\CidrOutOfRangeException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\InvalidPortMappingException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\PortOutOfRangeException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\TooManyPortsInRangeException
     */
    public function handleMultiple(Server $server, int $count): array
    {
        if (!config('pterodactyl.client_features.allocations.enabled')) {
            throw new AutoAllocationNotEnabledException();
        }

        // Try to find consecutive existing unassigned allocations on the same IP.
        $existingPorts = $server->node->allocations()
            ->where('ip', $server->allocation->ip)
            ->whereNull('server_id')
            ->orderBy('port')
            ->pluck('port')
            ->toArray();

        $consecutiveStart = $this->findConsecutiveStart($existingPorts, $count);

        if ($consecutiveStart !== null) {
            $allocations = $server->node->allocations()
                ->where('ip', $server->allocation->ip)
                ->whereNull('server_id')
                ->whereBetween('port', [$consecutiveStart, $consecutiveStart + $count - 1])
                ->get();

            foreach ($allocations as $allocation) {
                $allocation->update(['server_id' => $server->id]);
            }

            return $allocations->map->refresh()->all();
        }

        // Fall back to creating new consecutive allocations from the configured range.
        return $this->createNewConsecutiveAllocations($server, $count);
    }

    /**
     * Finds the starting port of the first consecutive sequence of the given length in a sorted
     * array of port numbers. Returns null if no such sequence exists.
     */
    protected function findConsecutiveStart(array $ports, int $count): ?int
    {
        $total = count($ports);
        for ($i = 0; $i <= $total - $count; ++$i) {
            $consecutive = true;
            for ($j = 1; $j < $count; ++$j) {
                if ($ports[$i + $j] !== $ports[$i] + $j) {
                    $consecutive = false;
                    break;
                }
            }
            if ($consecutive) {
                return $ports[$i];
            }
        }

        return null;
    }

    /**
     * Create a set of consecutive new allocations on the server's node from the defined range
     * in the settings. Raises an exception if no consecutive block of the required size is available.
     *
     * @return Allocation[]
     *
     * @throws \Pterodactyl\Exceptions\DisplayException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\CidrOutOfRangeException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\InvalidPortMappingException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\PortOutOfRangeException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\TooManyPortsInRangeException
     */
    protected function createNewConsecutiveAllocations(Server $server, int $count): array
    {
        $start = config('pterodactyl.client_features.allocations.range_start', null);
        $end = config('pterodactyl.client_features.allocations.range_end', null);

        if (!$start || !$end) {
            throw new NoAutoAllocationSpaceAvailableException();
        }

        Assert::integerish($start);
        Assert::integerish($end);

        $allocatedPorts = $server->node->allocations()
            ->where('ip', $server->allocation->ip)
            ->whereBetween('port', [$start, $end])
            ->pluck('port')
            ->toArray();

        $available = array_values(array_diff(range((int) $start, (int) $end), $allocatedPorts));

        $consecutiveStart = $this->findConsecutiveStart($available, $count);

        if ($consecutiveStart === null) {
            throw new NoAutoAllocationSpaceAvailableException();
        }

        $ports = range($consecutiveStart, $consecutiveStart + $count - 1);

        $this->service->handle($server->node, [
            'allocation_ip' => $server->allocation->ip,
            'allocation_ports' => array_map('strval', $ports),
        ]);

        $allocations = $server->node->allocations()
            ->where('ip', $server->allocation->ip)
            ->whereIn('port', $ports)
            ->get();

        foreach ($allocations as $allocation) {
            $allocation->update(['server_id' => $server->id]);
        }

        return $allocations->map->refresh()->all();
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
            ->where('ip', $server->allocation->ip)
            ->where('port', $port)
            ->firstOrFail();

        return $allocation;
    }
}
