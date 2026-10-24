<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Maintenance;

use Carbon\CarbonImmutable;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use InvalidArgumentException;
use Pterodactyl\Models\Backup;

#[Description('将所有超过 n 分钟仍未完成的备份标记为失败。')]
#[Signature('p:maintenance:prune-backups {--prune-age=}')]
class PruneOrphanedBackupsCommand extends Command
{
    public function handle(): void
    {
        $since = $this->option('prune-age') ?? config('backups.prune_age', 360);
        $minutes = filter_var($since, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        throw_if($minutes === false, InvalidArgumentException::class, '「--prune-age」参数必须为大于 0 的值。');

        $query = Backup::query()
            ->whereNull('completed_at')
            ->where('created_at', '<=', CarbonImmutable::now()->subMinutes($minutes)->toDateTimeString());

        $count = $query->count();
        if (! $count) {
            $this->info('没有需要标记为失败的孤立备份。');

            return;
        }

        $this->warn("正在将 $count 个超过 $minutes 分钟未完成的备份标记为失败。");

        $query->update([
            'is_successful' => false,
            'completed_at' => CarbonImmutable::now(),
            'updated_at' => CarbonImmutable::now(),
        ]);
    }
}
