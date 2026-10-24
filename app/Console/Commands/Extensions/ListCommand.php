<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Extensions;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Pterodactyl\Services\Extensions\ExtensionManifest;
use Pterodactyl\Services\Extensions\ExtensionRepository;

#[Description('列出所有已安装扩展及其状态。')]
#[Signature('p:extension:list')]
class ListCommand extends Command
{
    public function handle(ExtensionRepository $extensions): int
    {
        $records = $extensions->records();

        $rows = $extensions->discovered()->map(function (ExtensionManifest $manifest) use ($records): array {
            $record = $records->get($manifest->id);

            $state = match (true) {
                $record === null => '未注册',
                $record->enabled => 'enabled',
                default => 'disabled',
            };

            return [
                $manifest->id,
                $manifest->name,
                $manifest->version,
                $manifest->hasUi() ? 'yes' : 'no',
                $state,
                $record->error ?? '',
            ];
        })->values()->all();

        foreach ($extensions->discoveryErrors() as $directory => $error) {
            $rows[] = [$directory, '（清单无效）', '', '', 'error', $error];
        }

        if (empty($rows)) {
            $this->components->info('未安装任何扩展。可使用 p:extension:install 安装。');

            return self::SUCCESS;
        }

        $this->table(['ID', 'Name', 'Version', 'UI', 'State', 'Error'], $rows);

        return self::SUCCESS;
    }
}
