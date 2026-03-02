<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Nest;
use Pterodactyl\Models\Server;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Services\Servers\StartupCommandService;
use Pterodactyl\Repositories\Eloquent\ServerVariableRepository;
use Pterodactyl\Transformers\Api\Client\EggVariableTransformer;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Pterodactyl\Http\Requests\Api\Client\Servers\Startup\UpdateEggRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Startup\GetStartupRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Startup\UpdateStartupVariableRequest;

class StartupController extends ClientApiController
{
    /**
     * StartupController constructor.
     */
    public function __construct(
        private StartupCommandService $startupCommandService,
        private ServerVariableRepository $repository,
    ) {
        parent::__construct();
    }

    /**
     * Returns the startup information for the server including all the variables.
     */
    public function index(GetStartupRequest $request, Server $server): array
    {
        $startup = $this->startupCommandService->handle($server);

        $meta = [
            'startup_command' => $startup,
            'docker_images' => $server->egg->docker_images,
            'raw_startup_command' => $server->startup,
        ];

        // Include nests and eggs for switching if the global feature is enabled
        // and the user has the egg-change permission.
        $eggChangeMode = config('pterodactyl.client_features.egg_change.mode', 'disabled');
        if (
            $eggChangeMode !== 'disabled'
            && $request->user()->can('startup.egg-change', $server)
        ) {
            $meta['egg_change_mode'] = $eggChangeMode;
            $meta['nests'] = $this->buildNestsList();
            $meta['current_egg_id'] = $server->egg_id;
            $meta['current_nest_id'] = $server->nest_id;
        }

        return $this->fractal->collection(
            $server->variables()->where('user_viewable', true)->get()
        )
            ->transformWith($this->getTransformer(EggVariableTransformer::class))
            ->addMeta($meta)
            ->toArray();
    }

    /**
     * Updates a single variable for a server.
     *
     * @throws \Illuminate\Validation\ValidationException
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function update(UpdateStartupVariableRequest $request, Server $server): array
    {
        $variable = $server->variables()->where('env_variable', $request->input('key'))->first();

        if (is_null($variable) || !$variable->user_viewable) {
            throw new BadRequestHttpException('您试图编辑不存在的环境变量。');
        } elseif (!$variable->user_editable) {
            throw new BadRequestHttpException('您试图编辑的环境变量是只读的。');
        }

        $original = $variable->server_value;

        // Revalidate the variable value using the egg variable specific validation rules for it.
        $this->validate($request, ['value' => $variable->rules]);

        $this->repository->updateOrCreate([
            'server_id' => $server->id,
            'variable_id' => $variable->id,
        ], [
            'variable_value' => $request->input('value') ?? '',
        ]);

        $variable = $variable->refresh();
        $variable->server_value = $request->input('value');

        $startup = $this->startupCommandService->handle($server);

        if ($variable->env_variable !== $request->input('value')) {
            Activity::event('server:startup.edit')
                ->subject($variable)
                ->property([
                    'variable' => $variable->env_variable,
                    'old' => $original,
                    'new' => $request->input('value'),
                ])
                ->log();
        }

        return $this->fractal->item($variable)
            ->transformWith($this->getTransformer(EggVariableTransformer::class))
            ->addMeta([
                'startup_command' => $startup,
                'raw_startup_command' => $server->startup,
            ])
            ->toArray();
    }

    /**
     * Changes the egg (preset) for a server.
     *
     * @throws \Throwable
     */
    public function updateEgg(UpdateEggRequest $request, Server $server): array
    {
        if (config('pterodactyl.client_features.egg_change.mode', 'disabled') === 'disabled') {
            throw new BadRequestHttpException('此面板未启用前台切换预设功能。');
        }

        /** @var Egg $egg */
        $egg = Egg::query()->findOrFail($request->input('egg_id'));

        $originalEggId = $server->egg_id;
        $server->loadMissing('egg');
        $originalEggName = $server->egg?->name ?? (string) $originalEggId;

        $server->forceFill([
            'egg_id' => $egg->id,
            'nest_id' => $egg->nest_id,
            'startup' => $egg->startup,
        ])->saveOrFail();

        if ($originalEggId !== $egg->id) {
            Activity::event('server:startup.egg-change')
                ->property(['old' => $originalEggName, 'new' => $egg->name])
                ->log();
        }

        // Reload the egg relationship after updating
        $server->load('egg');

        $startup = $this->startupCommandService->handle($server);

        return $this->fractal->collection(
            $server->variables()->where('user_viewable', true)->get()
        )
            ->transformWith($this->getTransformer(EggVariableTransformer::class))
            ->addMeta([
                'startup_command' => $startup,
                'docker_images' => $server->egg->docker_images,
                'raw_startup_command' => $server->startup,
                'egg_change_mode' => config('pterodactyl.client_features.egg_change.mode', 'disabled'),
                'nests' => $this->buildNestsList(),
                'current_egg_id' => $server->egg_id,
                'current_nest_id' => $server->nest_id,
            ])
            ->toArray();
    }

    /**
     * Build the list of nests and their eggs for the egg-change feature.
     */
    private function buildNestsList(): array
    {
        return Nest::query()->with('eggs:id,nest_id,name')->get(['id', 'name'])
            ->map(function (Nest $nest) {
                return [
                    'id' => $nest->id,
                    'name' => $nest->name,
                    'eggs' => $nest->eggs->map(function (Egg $egg) {
                        return ['id' => $egg->id, 'name' => $egg->name];
                    })->values()->toArray(),
                ];
            })->values()->toArray();
    }
}
