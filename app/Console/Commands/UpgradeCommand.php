<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands;

use Closure;
use Exception;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Pterodactyl\Services\FilesystemChanges;
use Symfony\Component\Console\Helper\ProgressBar;

#[Description('从 GitHub 下载 Pterodactyl 新版本压缩包，并执行常规升级命令。')]
#[Signature('p:upgrade
        {--user= : 运行 PHP 的用户，所有文件将归属于该用户。}
        {--group= : 运行 PHP 的用户组，所有文件将归属于该用户组。}
        {--url= : 指定要下载的压缩包。}
        {--release= : 要从 GitHub 下载的指定 Pterodactyl 版本，留空则使用最新版。}
        {--skip-download : 设置后不下载压缩包。}')]
class UpgradeCommand extends Command
{
    protected const string DEFAULT_URL = 'https://github.com/pterodactyl/panel/releases/%s/panel.tar.gz';

    /**
     * Executes an upgrade command which will run through all of our standard
     * commands for Pterodactyl and enable users to basically just download
     * the archive and execute this and be done.
     *
     * This places the application in maintenance mode as well while the commands
     * are being executed.
     *
     * @throws Exception
     */
    public function handle(FilesystemChanges $files): int
    {
        $skipDownload = $this->option('skip-download');
        if (! $skipDownload) {
            $this->output->warning('此命令不会校验下载资源的完整性，继续前请确认您信任下载来源。若不想下载压缩包，请使用 --skip-download 参数，或在下方问题中回答「否」。');
            $this->output->comment('下载来源（通过 --url= 指定）：');
            $this->line($this->getUrl());
        }

        $user = is_string($this->option('user')) ? $this->option('user') : 'www-data';
        $group = is_string($this->option('group')) ? $this->option('group') : 'www-data';
        if ($this->input->isInteractive()) {
            if (! $skipDownload) {
                $skipDownload = ! $this->confirm('是否下载并解压最新版本的压缩包？', true);
            }

            if (($this->option('user')) === null) {
                $ownerId = fileowner('public');
                $userDetails = $ownerId !== false ? posix_getpwuid($ownerId) : false;
                $user = $userDetails !== false ? $userDetails['name'] : 'www-data';

                if (! $this->confirm("检测到您的 Web 服务器用户为 <fg=blue>[{$user}]:</>，是否正确？", true)) {
                    $user = $this->anticipate(
                        '请输入运行 Web 服务器进程的用户名。不同系统有所不同，常见为「www-data」「nginx」或「apache」。',
                        [
                            'www-data',
                            'nginx',
                            'apache',
                        ]
                    );
                    throw_unless(is_string($user), InvalidArgumentException::class, '必须提供运行 Web 服务器的用户。');
                }
            }

            if (($this->option('group')) === null) {
                $groupId = filegroup('public');
                $groupDetails = $groupId !== false ? posix_getgrgid($groupId) : false;
                $group = $groupDetails !== false ? $groupDetails['name'] : 'www-data';

                if (! $this->confirm("检测到您的 Web 服务器用户组为 <fg=blue>[{$group}]:</>，是否正确？", true)) {
                    $group = $this->anticipate(
                        '请输入运行 Web 服务器进程的用户组名，通常与用户名相同。',
                        [
                            'www-data',
                            'nginx',
                            'apache',
                        ]
                    );
                    throw_unless(is_string($group), InvalidArgumentException::class, '必须提供运行 Web 服务器的用户组。');
                }
            }

            if (! $this->confirm('确定要为面板执行升级流程吗？')) {
                $this->warn('升级流程已被用户终止。');

                return self::SUCCESS;
            }
        }

        $bar = $this->output->createProgressBar($skipDownload ? 9 : 10);
        $bar->start();

        $this->withProgress($bar, fn () => $this->runArtisan('down'));

        if (! $skipDownload) {
            $this->withProgress($bar, fn () => $this->download($files));
        }

        $this->withProgress($bar, fn () => $this->runProcess(['chmod', '-R', '755', 'storage', 'bootstrap/cache']));

        $this->withProgress($bar, function (): void {
            $command = ['composer', 'install', '--no-ansi'];
            if ($this->getLaravel()->isProduction() && ! config('app.debug')) {
                $command[] = '--optimize-autoloader';
                $command[] = '--no-dev';
            }

            $this->runProcess($command);
        });

        $this->withProgress($bar, fn () => $this->runArtisan('view:clear'));
        $this->withProgress($bar, fn () => $this->runArtisan('config:clear'));
        $this->withProgress($bar, fn () => $this->runArtisan('migrate', ['--force', '--seed']));
        $this->withProgress($bar, fn () => $this->runProcess(['chown', '-R', "{$user}:{$group}", $this->getLaravel()->basePath()]));
        $this->withProgress($bar, fn () => $this->runArtisan('queue:restart'));
        $this->withProgress($bar, fn () => $this->runArtisan('up'));

        $this->newLine(2);
        $this->info('面板已成功升级。请同时更新所有 Wings 实例：https://pterodactyl.io/docs/v2/wings/upgrading');

        return self::SUCCESS;
    }

    protected function withProgress(ProgressBar $bar, Closure $callback): void
    {
        $bar->clear();
        $callback();
        $bar->advance();
        $bar->display();
    }

    protected function getUrl(): string
    {
        if ($this->option('url')) {
            return $this->option('url');
        }

        return sprintf(self::DEFAULT_URL, $this->option('release') ? 'download/v'.$this->option('release') : 'latest/download');
    }

    private function download(FilesystemChanges $files): void
    {
        $directory = storage_path('app/.upgrade-'.Str::uuid());
        throw_unless(File::makeDirectory($directory, 0700, true), Exception::class, '无法创建临时升级目录。');
        $archive = $directory.DIRECTORY_SEPARATOR.'panel.tar.gz';

        try {
            $this->runProcess(['curl', '--fail', '--location', '--output', $archive, $this->getUrl()]);
            $this->runProcess(['tar', '-xzvf', $archive, '--directory', $this->getLaravel()->basePath()]);
        } finally {
            rescue(fn () => $files->delete($directory));
        }
    }

    /** @param list<string> $arguments */
    private function runArtisan(string $command, array $arguments = []): void
    {
        $this->runProcess([PHP_BINARY, 'artisan', $command, '--no-interaction', ...$arguments]);
    }

    /** @param list<string> $command */
    private function runProcess(array $command): void
    {
        $this->line('$upgrader> '.implode(' ', $command));
        Process::path($this->getLaravel()->basePath())
            ->timeout(10 * 60)
            ->run($command, fn (string $type, string $output) => $this->output->write($output))
            ->throw();
    }
}
