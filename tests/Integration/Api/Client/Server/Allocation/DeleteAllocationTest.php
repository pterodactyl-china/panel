<?php

declare(strict_types=1);

namespace Pterodactyl\Tests\Pest\Integration\Api\Client\Server\Allocation\DeleteAllocationTest;

use Illuminate\Http\Response;
use Pterodactyl\Enum\Permissions;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Models\Server;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

uses(ClientApiIntegrationTestCase::class);
dataset('permissionDataProvider', function () {
    return [[[Permissions::AllocationDelete->value]], [[]]];
});
test('allocation can be deleted from server', function (array $permission) {
    /** @var Server $server */
    [$user, $server] = $this->generateTestAccount($permission);
    $server->update(['allocation_limit' => 2]);
    /** @var Allocation $allocation */
    $allocation = Allocation::factory()->create(['server_id' => $server->id, 'node_id' => $server->node_id, 'notes' => 'hodor']);
    $this->actingAs($user)->deleteJson($this->link($allocation))->assertStatus(Response::HTTP_NO_CONTENT);
    $this->assertDatabaseHas('allocations', ['id' => $allocation->id, 'server_id' => null, 'notes' => null]);
    $this->assertActivityFor('server:allocation.delete', $user, $server, $allocation);
})->with('permissionDataProvider');
test('error is returned if user does not have permission', function () {
    /** @var Server $server */
    [$user, $server] = $this->generateTestAccount([Permissions::AllocationCreate->value]);
    /** @var Allocation $allocation */
    $allocation = Allocation::factory()->create(['server_id' => $server->id, 'node_id' => $server->node_id, 'notes' => 'hodor']);
    $this->actingAs($user)->deleteJson($this->link($allocation))->assertForbidden();
    $this->assertDatabaseHas('allocations', ['id' => $allocation->id, 'server_id' => $server->id]);
});
test('error is returned if allocation is primary', function () {
    /** @var Server $server */
    [$user, $server] = $this->generateTestAccount();
    $server->update(['allocation_limit' => 2]);
    $this->actingAs($user)->deleteJson($this->link($server->allocation))->assertStatus(Response::HTTP_BAD_REQUEST)->assertJsonPath('errors.0.code', 'DisplayException')->assertJsonPath('errors.0.detail', '无法删除此服务器的主分配端口。');
});
test('allocation cannot be deleted if server limit is not defined', function () {
    [$user, $server] = $this->generateTestAccount();
    /** @var Allocation $allocation */
    $allocation = Allocation::factory()->forServer($server)->create(['notes' => 'Test notes']);
    $this->actingAs($user)->deleteJson($this->link($allocation))->assertStatus(400)->assertJsonPath('errors.0.detail', '无法删除此服务器的端口：未设置端口上限。');
    $allocation->refresh();
    expect($allocation->notes)->not->toBeNull();
    expect($allocation->server_id)->toEqual($server->id);
});
test('error is returned if allocation does not belong to server', function () {
    /** @var Server $server */
    [$user, $server] = $this->generateTestAccount();
    [, $server2] = $this->generateTestAccount();
    $this->actingAs($user)->deleteJson($this->link($server2->allocation))->assertNotFound();
    $this->actingAs($user)->deleteJson($this->link($server, "/network/allocations/{$server2->allocation_id}"))->assertNotFound();
});
