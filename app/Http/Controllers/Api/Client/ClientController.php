<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Controllers\Api\Client;

use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\QueryParam;
use Knuckles\Scribe\Attributes\Response as ScribeResponse;
use Knuckles\Scribe\Attributes\Subgroup;
use Pterodactyl\Extensions\Scribe\Attributes\ResponseFromResource;
use Pterodactyl\Http\Requests\Api\Client\GetServersRequest;
use Pterodactyl\Http\Resources\Api\ApiResourceCollection;
use Pterodactyl\Http\Resources\Api\Client\ServerResource;
use Pterodactyl\Models\Filters\MultiFieldServerFilter;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\Servers\SubuserPermissionCatalog;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

#[Group('Client API', 'Endpoints authenticated as a panel user using a client API token.')]
#[Subgroup('Client Overview', 'Discover servers and permissions available to the authenticated user.')]
class ClientController extends ClientApiController
{
    private const array PERMISSIONS_EXAMPLE = [
        'object' => 'system_permissions',
        'attributes' => [
            'permissions' => [
                'websocket' => [
                    'description' => '允许用户连接服务器 WebSocket，从而查看控制台输出与实时资源占用。',
                    'keys' => [
                        'connect' => '允许用户连接服务器的 WebSocket，以实时接收控制台输出。',
                    ],
                ],
                'control' => [
                    'description' => '控制用户对服务器电源状态与命令发送的权限。',
                    'keys' => [
                        'console' => '允许用户通过控制台向服务器发送命令。',
                        'start' => '允许用户在服务器停止时启动它。',
                        'stop' => '允许用户停止正在运行的服务器。',
                        'restart' => 'Allows a user to perform a server restart.',
                    ],
                ],
            ],
        ],
    ];

    /**
     * Return all the servers available to the client making the API
     * request, including servers the user has access to as a subuser.
     */
    #[Endpoint('List client servers', 'Returns a paginated list of servers the authenticated user can access as an owner, subuser, or administrator.')]
    #[QueryParam('page', 'integer', 'Page number to return.', required: false, example: 1)]
    #[QueryParam('per_page', 'integer', 'Number of servers to return per page. The maximum is 100.', required: false, example: 50)]
    #[QueryParam('type', 'string', 'Scope of servers to return. "owner" returns owned servers, "admin" returns admin-accessible servers excluding owned or subuser servers, and "admin-all" returns all servers for root administrators.', required: false, example: 'owner', enum: ['owner', 'admin', 'admin-all'])]
    #[QueryParam('filter[uuid]', 'string', 'Filter servers by UUID.', required: false, example: '4fcb1f44-0f90-4a1a-a8bf-7cc8a14d0f26')]
    #[QueryParam('filter[name]', 'string', 'Filter servers by name.', required: false, example: 'Minecraft Server')]
    #[QueryParam('filter[description]', 'string', 'Filter servers by description.', required: false, example: 'Production')]
    #[QueryParam('filter[external_id]', 'string', 'Filter servers by external identifier.', required: false, example: 'billing-server-42')]
    #[QueryParam('filter[*]', 'string', 'Search across server name, UUID, short UUID, external identifier, or allocation address and port.', required: false, example: '192.0.2.10:25565')]
    #[ResponseFromResource(ServerResource::class, Server::class, description: 'Accessible servers returned.', collection: true, factoryStates: ['withRelationships'], resourceKey: 'server', paginate: 50)]
    public function index(GetServersRequest $request): ApiResourceCollection
    {
        $user = $request->user();

        $builder = QueryBuilder::for(Server::query())->allowedFilters([
            'uuid',
            'name',
            'description',
            'external_id',
            AllowedFilter::custom('*', new MultiFieldServerFilter),
        ]);

        $type = $request->validated('type');
        // Either return all the servers the user has access to because they are an admin `?type=admin` or
        // just return all the servers the user has access to because they are the owner or a subuser of the
        // server. If ?type=admin-all is passed all servers on the system will be returned to the user, rather
        // than only servers they can see because they are an admin.
        if (in_array($type, ['admin', 'admin-all'])) {
            // If they aren't an admin but want all the admin servers don't fail the request, just
            // make it a query that will never return any results back.
            if (! $user->root_admin) {
                $builder->whereRaw('1 = 2');
            } else {
                $builder = $type === 'admin-all'
                    ? $builder
                    : $builder->whereNotIn('servers.id', $user->accessibleServers()->pluck('id')->all());
            }
        } elseif ($type === 'owner') {
            $builder = $builder->where('servers.owner_id', $user->id);
        } else {
            $builder = $builder->whereIn('servers.id', $user->accessibleServers()->pluck('id')->all());
        }

        $servers = $builder->paginate(min($request->integer('per_page', 50), 100))->appends($request->query());

        return ServerResource::collection($servers);
    }

    /**
     * Returns all the subuser permissions available on the system, including those
     * registered by enabled extensions.
     *
     * @return array{object: string, attributes: array<string, mixed>}
     */
    #[Endpoint('List server permissions', 'Returns the permission keys that can be granted to server subusers, including those registered by enabled extensions under `ext.<extension id>`.')]
    #[ScribeResponse(self::PERMISSIONS_EXAMPLE, description: 'System permission definitions returned.')]
    public function permissions(SubuserPermissionCatalog $catalog): array
    {
        return [
            'object' => 'system_permissions',
            'attributes' => [
                'permissions' => $catalog->groups(),
            ],
        ];
    }
}
