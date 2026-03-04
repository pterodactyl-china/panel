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
     * Finds or creates a set of consecutive (sequential) unassigned allocations and assigns
     * them all to the given server.
     *
     * @return Allocation[]
     *
     * @throws \Pterodactyl\Exceptions\DisplayException
     * @throws AutoAllocationNotEnabledException
     * @throws NoAutoAllocationSpaceAvailableException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\CidrOutOfRangeException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\InvalidPortMappingException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\PortOutOfRangeException
     * @throws \Pterodactyl\Exceptions\Service\Allocation\TooManyPortsInRangeException
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

        // Get all ports already assigned to any server on this node/ip within the range.
        // Unassigned allocations (server_id = null) are still considered available.
        $usedPorts = $server->node->allocations()
            ->where('ip', $ip)
            ->whereBetween('port', [$start, $end])
            ->whereNotNull('server_id')
            ->pluck('port')
            ->toArray();

        $available = array_values(array_diff(range((int) $start, (int) $end), $usedPorts));

        // Build a set of available ports for O(1) lookup, then shuffle the ports so that
        // the starting candidate is chosen randomly — mirroring how single-port allocation
        // uses array_rand to avoid always picking from the beginning of the range.
        $availableSet = array_flip($available);
        shuffle($available);

        $consecutiveStart = null;
        foreach ($available as $candidate) {
            $valid = true;
            for ($j = 1; $j < $count; ++$j) {
                if (!isset($availableSet[$candidate + $j])) {
                    $valid = false;
                    break;
                }
            }
            if ($valid) {
                $consecutiveStart = $candidate;
                break;
            }
        }

        if ($consecutiveStart === null) {
            throw new NoAutoAllocationSpaceAvailableException();
        }

        $ports = range($consecutiveStart, $consecutiveStart + $count - 1);

        // Create any ports in the range that don't already exist as allocations.
        $existingPorts = $server->node->allocations()
            ->where('ip', $ip)
            ->whereIn('port', $ports)
            ->pluck('port')
            ->toArray();

        $newPorts = array_values(array_diff($ports, $existingPorts));

        if (!empty($newPorts)) {
            $this->service->handle($server->node, [
                'allocation_ip' => $ip,
                'allocation_ports' => $newPorts,
            ]);
        }

        // Assign all the consecutive allocations to the server.
        $allocations = $server->node->allocations()
            ->where('ip', $ip)
            ->whereIn('port', $ports)
            ->whereNull('server_id')
            ->get();

        if ($allocations->count() !== $count) {
            throw new NoAutoAllocationSpaceAvailableException();
        }

        $allocations->each(function (Allocation $allocation) use ($server) {
            $allocation->update(['server_id' => $server->id]);
        });

        return $allocations->map(fn (Allocation $a) => $a->refresh())->all();
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
