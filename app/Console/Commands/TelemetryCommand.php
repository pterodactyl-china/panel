<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Pterodactyl\Services\Telemetry\TelemetryCollectionService;
use Symfony\Component\VarDumper\VarDumper;

#[Description('显示在启用遥测采集时会发送给 Pterodactyl 遥测服务的全部数据。')]
#[Signature('p:telemetry')]
class TelemetryCommand extends Command
{
    /**
     * Handle execution of command.
     */
    public function handle(TelemetryCollectionService $telemetryCollectionService): void
    {
        $this->output->info('正在采集遥测数据，这可能需要一些时间...');

        VarDumper::dump($telemetryCollectionService->collect());
    }
}
