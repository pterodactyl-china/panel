<?php

namespace Pterodactyl\Tests\Integration\Api\Client\Server\Allocation;

use Illuminate\Http\Response;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Models\Permission;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

class CreateNewAllocationTest extends ClientApiIntegrationTestCase
{
    /**
     * Setup tests.
     */
    public function setUp(): void
    {
        parent::setUp();

        config()->set('pterodactyl.client_features.allocations.enabled', true);
        config()->set('pterodactyl.client_features.allocations.range_start', 5000);
        config()->set('pterodactyl.client_features.allocations.range_end', 5050);
    }

    /**
     * Tests that a new allocation can be properly assigned to a server.
     */
    #[\PHPUnit\Framework\Attributes\DataProvider('permissionDataProvider')]
    public function testNewAllocationCanBeAssignedToServer(array $permission)
    {
        /** @var \Pterodactyl\Models\Server $server */
        [$user, $server] = $this->generateTestAccount($permission);
        $server->update(['allocation_limit' => 2]);

        $response = $this->actingAs($user)->postJson($this->link($server, '/network/allocations'));
        $response->assertJsonPath('object', Allocation::RESOURCE_NAME);

        $matched = Allocation::query()->findOrFail($response->json('attributes.id'));

        $this->assertSame($server->id, $matched->server_id);
        $this->assertJsonTransformedWith($response->json('attributes'), $matched);
    }

    /**
     * Test that a user without the required permissions cannot create an allocation for
     * the server instance.
     */
    public function testAllocationCannotBeCreatedIfUserDoesNotHavePermission()
    {
        /** @var \Pterodactyl\Models\Server $server */
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_ALLOCATION_UPDATE]);
        $server->update(['allocation_limit' => 2]);

        $this->actingAs($user)->postJson($this->link($server, '/network/allocations'))->assertForbidden();
    }

    /**
     * Test that an error is returned to the user if this feature is not enabled on the system.
     */
    public function testAllocationCannotBeCreatedIfNotEnabled()
    {
        config()->set('pterodactyl.client_features.allocations.enabled', false);

        /** @var \Pterodactyl\Models\Server $server */
        [$user, $server] = $this->generateTestAccount();
        $server->update(['allocation_limit' => 2]);

        $this->actingAs($user)->postJson($this->link($server, '/network/allocations'))
            ->assertStatus(Response::HTTP_BAD_REQUEST)
            ->assertJsonPath('errors.0.code', 'AutoAllocationNotEnabledException')
            ->assertJsonPath('errors.0.detail', '此实例未启用服务器自动分配功能。');
    }

    /**
     * Test that an allocation cannot be created if the server has reached its allocation limit.
     */
    public function testAllocationCannotBeCreatedIfServerIsAtLimit()
    {
        /** @var \Pterodactyl\Models\Server $server */
        [$user, $server] = $this->generateTestAccount();
        $server->update(['allocation_limit' => 1]);

        $this->actingAs($user)->postJson($this->link($server, '/network/allocations'))
            ->assertStatus(Response::HTTP_BAD_REQUEST)
            ->assertJsonPath('errors.0.code', 'DisplayException')
            ->assertJsonPath('errors.0.detail', 'Cannot assign additional allocations to this server: limit has been reached.');
    }

    /**
     * Test that consecutive allocations can be created when the feature is enabled.
     */
    public function testConsecutiveAllocationsCanBeCreated()
    {
        config()->set('pterodactyl.client_features.allocations.consecutive.enabled', true);
        config()->set('pterodactyl.client_features.allocations.consecutive.limit', 3);

        /** @var \Pterodactyl\Models\Server $server */
        [$user, $server] = $this->generateTestAccount();
        $server->update(['allocation_limit' => 5]);

        $response = $this->actingAs($user)->postJson($this->link($server, '/network/allocations'), ['count' => 2]);
        $response->assertStatus(Response::HTTP_OK);
        $response->assertJsonPath('object', 'list');

        $data = $response->json('data');
        $this->assertCount(2, $data);

        $ports = array_map(fn ($item) => $item['attributes']['port'], $data);
        sort($ports);
        $this->assertSame($ports[1], $ports[0] + 1, 'Returned ports must be consecutive.');
    }

    /**
     * Test that requesting consecutive allocations fails when the feature is disabled.
     */
    public function testConsecutiveAllocationFailsWhenFeatureNotEnabled()
    {
        config()->set('pterodactyl.client_features.allocations.consecutive.enabled', false);

        /** @var \Pterodactyl\Models\Server $server */
        [$user, $server] = $this->generateTestAccount();
        $server->update(['allocation_limit' => 5]);

        $this->actingAs($user)->postJson($this->link($server, '/network/allocations'), ['count' => 2])
            ->assertStatus(Response::HTTP_BAD_REQUEST)
            ->assertJsonPath('errors.0.code', 'DisplayException')
            ->assertJsonPath('errors.0.detail', '连续端口分配功能未启用。');
    }

    /**
     * Test that requesting more consecutive allocations than the configured limit fails.
     */
    public function testConsecutiveAllocationFailsWhenCountExceedsLimit()
    {
        config()->set('pterodactyl.client_features.allocations.consecutive.enabled', true);
        config()->set('pterodactyl.client_features.allocations.consecutive.limit', 3);

        /** @var \Pterodactyl\Models\Server $server */
        [$user, $server] = $this->generateTestAccount();
        $server->update(['allocation_limit' => 10]);

        $this->actingAs($user)->postJson($this->link($server, '/network/allocations'), ['count' => 5])
            ->assertStatus(Response::HTTP_BAD_REQUEST)
            ->assertJsonPath('errors.0.code', 'DisplayException')
            ->assertJsonPath('errors.0.detail', '最多只能请求 3 个连续端口。');
    }

    public static function permissionDataProvider(): array
    {
        return [[[Permission::ACTION_ALLOCATION_CREATE]], [[]]];
    }
}
