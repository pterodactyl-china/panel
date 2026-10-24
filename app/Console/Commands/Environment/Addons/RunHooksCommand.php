<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Environment\Addons;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Str;

#[Description('为指定事件执行附加组件的生命周期钩子脚本。')]
#[Signature('p:environment:addons:run-hooks
                            {event : 要执行钩子的生命周期事件（例如 post-install）。}')]
class RunHooksCommand extends Command
{
    /**
     * Runs every executable "addons/<name>/hooks/<event>" script for the given lifecycle event when addon hooks are enabled.
     */
    public function handle(): int
    {
        if (! config('addons.hooks_enabled')) {
            return self::SUCCESS;
        }

        $event = $this->argument('event');
        if (! Str::isMatch('/^[a-z0-9-]+$/', $event)) {
            $this->components->error("无效的钩子事件名：{$event}");

            return self::INVALID;
        }

        $hooks = Collection::make(glob(base_path("addons/*/hooks/{$event}")) ?: [])
            ->filter(fn (string $hook): bool => is_executable($hook))
            ->values();

        if ($hooks->isEmpty()) {
            return self::SUCCESS;
        }

        if ($this->input->isInteractive() && ! $this->confirm(
            sprintf('是否为事件「%2$s」执行 %1$d 个附加组件钩子脚本？它们将以本进程的权限运行。', $hooks->count(), $event)
        )) {
            return self::SUCCESS;
        }

        $hooks->each($this->runHook(...));

        return self::SUCCESS;
    }

    /**
     * Streams a single hook's output, reporting a non-zero exit without aborting the remaining hooks.
     */
    private function runHook(string $hook): void
    {
        $this->components->info("正在执行附加组件钩子：{$hook}");

        $result = Process::path(base_path())
            ->forever()
            ->run([$hook], fn (string $type, string $output) => $this->output->write($output));

        if ($result->failed()) {
            $this->components->warn("附加组件钩子以错误退出：{$hook}");
        }
    }
}
