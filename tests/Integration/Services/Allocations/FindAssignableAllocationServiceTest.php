<?php

namespace Pterodactyl\Tests\Integration\Services\Allocations;

use Pterodactyl\Models\Allocation;
use Pterodactyl\Tests\Integration\IntegrationTestCase;
use Pterodactyl\Services\Allocations\FindAssignableAllocationService;
use Pterodactyl\Exceptions\Service\Allocation\AutoAllocationNotEnabledException;
use Pterodactyl\Exceptions\Service\Allocation\NoAutoAllocationSpaceAvailableException;

class FindAssignableAllocationServiceTest extends IntegrationTestCase
{
    /**
     * Setup tests.
     */
    public function setUp(): void
    {
        parent::setUp();

        config()->set('pterodactyl.client_features.allocations.enabled', true);
        config()->set('pterodactyl.client_features.allocations.range_start', 0);
        config()->set('pterodactyl.client_features.allocations.range_end', 0);
    }

    /**
     * Test that an unassigned allocation is preferred rather than creating an entirely new
     * allocation for the server.
     */
    public function testExistingAllocationIsPreferred()
    {
        $server = $this->createServerModel();

        $created = Allocation::factory()->create([
            'node_id' => $server->node_id,
            'ip' => $server->allocation->ip,
        ]);

        $response = $this->getService()->handle($server);

        $this->assertSame($created->id, $response->id);
        $this->assertSame($server->allocation->ip, $response->ip);
        $this->assertSame($server->node_id, $response->node_id);
        $this->assertSame($server->id, $response->server_id);
        $this->assertNotSame($server->allocation_id, $response->id);
    }

    /**
     * Test that a new allocation is created if there is not a free one available.
     */
    public function testNewAllocationIsCreatedIfOneIsNotFound()
    {
        $server = $this->createServerModel();
        config()->set('pterodactyl.client_features.allocations.range_start', 5000);
        config()->set('pterodactyl.client_features.allocations.range_end', 5005);

        $response = $this->getService()->handle($server);
        $this->assertSame($server->id, $response->server_id);
        $this->assertSame($server->allocation->ip, $response->ip);
        $this->assertSame($server->node_id, $response->node_id);
        $this->assertNotSame($server->allocation_id, $response->id);
        $this->assertTrue($response->port >= 5000 && $response->port <= 5005);
    }

    /**
     * Test that a currently assigned port is never assigned to a server.
     */
    public function testOnlyPortNotInUseIsCreated()
    {
        $server = $this->createServerModel();
        $server2 = $this->createServerModel(['node_id' => $server->node_id]);

        config()->set('pterodactyl.client_features.allocations.range_start', 5000);
        config()->set('pterodactyl.client_features.allocations.range_end', 5001);

        Allocation::factory()->create([
            'server_id' => $server2->id,
            'node_id' => $server->node_id,
            'ip' => $server->allocation->ip,
            'port' => 5000,
        ]);

        $response = $this->getService()->handle($server);
        $this->assertSame(5001, $response->port);
    }

    public function testExceptionIsThrownIfNoMoreAllocationsCanBeCreatedInRange()
    {
        $server = $this->createServerModel();
        $server2 = $this->createServerModel(['node_id' => $server->node_id]);
        config()->set('pterodactyl.client_features.allocations.range_start', 5000);
        config()->set('pterodactyl.client_features.allocations.range_end', 5005);

        for ($i = 5000; $i <= 5005; ++$i) {
            Allocation::factory()->create([
                'ip' => $server->allocation->ip,
                'port' => $i,
                'node_id' => $server->node_id,
                'server_id' => $server2->id,
            ]);
        }

        $this->expectException(NoAutoAllocationSpaceAvailableException::class);
        $this->expectExceptionMessage('Cannot assign additional allocation: no more space available on node.');

        $this->getService()->handle($server);
    }

    /**
     * Test that we only auto-allocate from the current server's IP address space, and not a random
     * IP address available on that node.
     */
    public function testExceptionIsThrownIfOnlyFreePortIsOnADifferentIp()
    {
        $server = $this->createServerModel();

        Allocation::factory()->times(5)->create(['node_id' => $server->node_id]);

        $this->expectException(NoAutoAllocationSpaceAvailableException::class);
        $this->expectExceptionMessage('Cannot assign additional allocation: no more space available on node.');

        $this->getService()->handle($server);
    }

    public function testExceptionIsThrownIfStartOrEndRangeIsNotDefined()
    {
        $server = $this->createServerModel();

        $this->expectException(NoAutoAllocationSpaceAvailableException::class);
        $this->expectExceptionMessage('Cannot assign additional allocation: no more space available on node.');

        $this->getService()->handle($server);
    }

    public function testExceptionIsThrownIfStartOrEndRangeIsNotNumeric()
    {
        $server = $this->createServerModel();
        config()->set('pterodactyl.client_features.allocations.range_start', 'hodor');
        config()->set('pterodactyl.client_features.allocations.range_end', 10);

        try {
            $this->getService()->handle($server);
            $this->fail('This assertion should not be reached.');
        } catch (\Exception $exception) {
            $this->assertInstanceOf(\InvalidArgumentException::class, $exception);
            $this->assertSame('Expected an integerish value. Got: string', $exception->getMessage());
        }

        config()->set('pterodactyl.client_features.allocations.range_start', 10);
        config()->set('pterodactyl.client_features.allocations.range_end', 'hodor');

        try {
            $this->getService()->handle($server);
            $this->fail('This assertion should not be reached.');
        } catch (\Exception $exception) {
            $this->assertInstanceOf(\InvalidArgumentException::class, $exception);
            $this->assertSame('Expected an integerish value. Got: string', $exception->getMessage());
        }
    }

    public function testExceptionIsThrownIfFeatureIsNotEnabled()
    {
        config()->set('pterodactyl.client_features.allocations.enabled', false);
        $server = $this->createServerModel();

        $this->expectException(AutoAllocationNotEnabledException::class);

        $this->getService()->handle($server);
    }

    /**
     * Test that handleMultiple finds and assigns consecutive existing unassigned allocations.
     */
    public function testHandleMultipleFindsExistingConsecutiveAllocations()
    {
        $server = $this->createServerModel();

        // Create consecutive unassigned allocations.
        Allocation::factory()->create([
            'node_id' => $server->node_id,
            'ip' => $server->allocation->ip,
            'port' => 6000,
        ]);
        Allocation::factory()->create([
            'node_id' => $server->node_id,
            'ip' => $server->allocation->ip,
            'port' => 6001,
        ]);
        Allocation::factory()->create([
            'node_id' => $server->node_id,
            'ip' => $server->allocation->ip,
            'port' => 6002,
        ]);

        $result = $this->getService()->handleMultiple($server, 2);

        $this->assertCount(2, $result);
        $ports = array_map(fn ($a) => $a->port, $result);
        sort($ports);
        $this->assertSame(6000, $ports[0]);
        $this->assertSame(6001, $ports[1]);

        foreach ($result as $allocation) {
            $this->assertSame($server->id, $allocation->server_id);
        }
    }

    /**
     * Test that handleMultiple creates new consecutive allocations from the configured range
     * when no consecutive existing allocations are available.
     */
    public function testHandleMultipleCreatesNewConsecutiveAllocations()
    {
        $server = $this->createServerModel();
        config()->set('pterodactyl.client_features.allocations.range_start', 7000);
        config()->set('pterodactyl.client_features.allocations.range_end', 7010);

        $result = $this->getService()->handleMultiple($server, 3);

        $this->assertCount(3, $result);
        $ports = array_map(fn ($a) => $a->port, $result);
        sort($ports);
        // Ports must be consecutive.
        $this->assertSame($ports[1], $ports[0] + 1);
        $this->assertSame($ports[2], $ports[0] + 2);

        foreach ($result as $allocation) {
            $this->assertSame($server->id, $allocation->server_id);
            $this->assertSame($server->allocation->ip, $allocation->ip);
        }
    }

    /**
     * Test that handleMultiple skips non-consecutive gaps and finds the first valid block.
     */
    public function testHandleMultipleSkipsNonConsecutiveGaps()
    {
        $server = $this->createServerModel();
        config()->set('pterodactyl.client_features.allocations.range_start', 8000);
        config()->set('pterodactyl.client_features.allocations.range_end', 8010);

        // Occupy 8000 so 8001-8003 is the first consecutive block.
        Allocation::factory()->create([
            'node_id' => $server->node_id,
            'ip' => $server->allocation->ip,
            'port' => 8000,
            'server_id' => $server->id,
        ]);

        $result = $this->getService()->handleMultiple($server, 3);

        $this->assertCount(3, $result);
        $ports = array_map(fn ($a) => $a->port, $result);
        sort($ports);
        $this->assertSame(8001, $ports[0]);
        $this->assertSame(8002, $ports[1]);
        $this->assertSame(8003, $ports[2]);
    }

    /**
     * Test that handleMultiple throws when no consecutive block is available.
     */
    public function testHandleMultipleThrowsWhenNoConsecutiveBlockAvailable()
    {
        $server = $this->createServerModel();
        config()->set('pterodactyl.client_features.allocations.range_start', 9000);
        config()->set('pterodactyl.client_features.allocations.range_end', 9004);

        // Occupy every other port so no 3 consecutive ports exist: 9000, 9002, 9004 taken.
        foreach ([9000, 9002, 9004] as $port) {
            Allocation::factory()->create([
                'node_id' => $server->node_id,
                'ip' => $server->allocation->ip,
                'port' => $port,
                'server_id' => $server->id,
            ]);
        }

        $this->expectException(NoAutoAllocationSpaceAvailableException::class);

        $this->getService()->handleMultiple($server, 3);
    }

    /**
     * Test that handleMultiple throws when the auto-allocation feature is not enabled.
     */
    public function testHandleMultipleThrowsWhenFeatureNotEnabled()
    {
        config()->set('pterodactyl.client_features.allocations.enabled', false);
        $server = $this->createServerModel();

        $this->expectException(AutoAllocationNotEnabledException::class);

        $this->getService()->handleMultiple($server, 2);
    }

    private function getService(): FindAssignableAllocationService
    {
        return $this->app->make(FindAssignableAllocationService::class);
    }
}
