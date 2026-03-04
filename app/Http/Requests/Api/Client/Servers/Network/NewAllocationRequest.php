<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Network;

use Pterodactyl\Models\Permission;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class NewAllocationRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_ALLOCATION_CREATE;
    }

    public function rules(): array
    {
        $limit = (int) config('pterodactyl.client_features.allocations.consecutive_limit', 3);

        return [
            'count' => ['nullable', 'integer', "between:1,{$limit}"],
        ];
    }
}
