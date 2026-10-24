<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Server;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\Factory as ValidatorFactory;
use Illuminate\Validation\ValidationException;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Facades\Daemon;
use Pterodactyl\Models\Server;

#[Description('对大量服务器或节点一次性执行批量电源管理。')]
#[Signature('p:server:bulk-power
                            {action : 要执行的操作（start、stop、restart、kill）}
                            {--servers= : 以逗号分隔的服务器列表。}
                            {--nodes= : 以逗号分隔的节点列表。}')]
class BulkPowerActionCommand extends Command
{
    /**
     * Handle the bulk power request.
     *
     * @throws ValidationException
     */
    public function handle(ValidatorFactory $validators): void
    {
        $action = $this->argument('action');
        $nodes = empty($this->option('nodes')) ? [] : explode(',', $this->option('nodes'));
        $servers = empty($this->option('servers')) ? [] : explode(',', $this->option('servers'));

        $validator = $validators->make([
            'action' => $action,
            'nodes' => $nodes,
            'servers' => $servers,
        ], [
            'action' => ['string', 'in:start,stop,kill,restart'],
            'nodes' => ['array'],
            'nodes.*' => ['integer', 'min:1'],
            'servers' => ['array'],
            'servers.*' => ['integer', 'min:1'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->getMessageBag()->all() as $message) {
                $this->output->error($message);
            }

            throw new ValidationException($validator);
        }

        $count = $this->getQueryBuilder($servers, $nodes)->count();
        if ($this->input->isInteractive() && ! $this->confirm(trans('command/messages.server.power.confirm', ['action' => $action, 'count' => $count]))) {
            return;
        }

        $bar = $this->output->createProgressBar($count);
        $this->getQueryBuilder($servers, $nodes)->each(function (Server $server) use ($action, &$bar): void {
            $bar->clear();

            try {
                Daemon::server($server)->power($action);
            } catch (DaemonConnectionException $daemonConnectionException) {
                $this->output->error(trans('command/messages.server.power.action_failed', [
                    'name' => $server->name,
                    'id' => $server->id,
                    'node' => $server->node->name,
                    'message' => $daemonConnectionException->getMessage(),
                ]));
            }

            $bar->advance();
            $bar->display();
        });

        $this->line('');
    }

    /**
     * Returns the query builder instance that will return the servers that should be affected.
     *
     * @param  list<string>  $servers
     * @param  list<string>  $nodes
     * @return Builder<Server>
     */
    protected function getQueryBuilder(array $servers, array $nodes): Builder
    {
        $instance = Server::query()->whereNull('status');

        if ($servers !== [] && $nodes !== []) {
            $instance->where(fn (Builder $targets): Builder => $targets->whereIn('id', $servers)->orWhereIn('node_id', $nodes));
        } elseif ($servers !== []) {
            $instance->whereIn('id', $servers);
        } elseif ($nodes !== []) {
            $instance->whereIn('node_id', $nodes);
        }

        return $instance->with('node');
    }
}
