<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Startup;

use Pterodactyl\Models\Permission;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class UpdateEggRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_STARTUP_EGG_CHANGE;
    }

    public function rules(): array
    {
        return [
            'egg_id' => 'required|integer|exists:eggs,id',
        ];
    }
}
