<?php

namespace Pterodactyl\Console\Commands;

use Closure;
use Illuminate\Console\Command;
use Pterodactyl\Console\Kernel;
use Symfony\Component\Process\Process;
use Symfony\Component\Console\Helper\ProgressBar;

class UpgradeCommand extends Command
{
    protected const DEFAULT_URL = 'https://github.com/pterodactyl/panel/releases/%s/panel.tar.gz';

    /** @var string */
    protected $signature = 'p:upgrade
        {--user= : The user that PHP runs under. All files will be owned by this user.}
        {--url= : The specific archive to download.}
        {--release= : A specific Pterodactyl version to download from GitHub. Leave blank to use latest.}
        {--skip-download : If set no archive will be downloaded.}';

    /** @var string */
    protected $description = 'Downloads a new archive for Pterodactyl from GitHub and then executes the normal upgrade commands.';

    /**
     * Executes an upgrade command which will run through all of our standard
     * commands for Pterodactyl and enable users to basically just download
     * the archive and execute this and be done.
     *
     * This places the application in maintenance mode as well while the commands
     * are being executed.
     *
     * @throws \Exception
     */
    public function handle()
    {
        $skipDownload = $this->option('skip-download');

        if (!$skipDownload) {
            $this->output->warning('This command does not verify the integrity of downloaded assets. Please ensure that you trust the download source before continuing. If you do not wish to download an archive, please indicate that using the --skip-download flag, or answering "no" to the question below.');
            $this->output->comment('Download Source (set with --url=):');
            $this->line($this->getUrl());
        }

        $user = 'www-data';
        if ($this->input->isInteractive()) {
            if (!$skipDownload) {
                $skipDownload = !$this->confirm('Would you like to download and unpack the archive files for the latest version?', true);
            }

            if (is_null($this->option('user'))) {
                $details = posix_getpwuid(fileowner('public'));
                $user = $details['name'] ?? 'www-data';

                if (!$this->confirm("Your webserver user has been detected as [{$user}]: is this correct?", true)) {
                    $user = $this->anticipate(
                        'Please enter the name of the user running your webserver process. This varies from system to system, but is generally "www-data", "nginx", or "apache".',
                        [
                            'www-data',
                            'apache',
                            'nginx',
                        ]
                    );
                }
            }

            if (!$this->confirm('Are you sure you want to run the upgrade process for your Panel?')) {
                return;
            }
        }

        ini_set('output_buffering', 0);
        $bar = $this->output->createProgressBar($skipDownload ? 9 : 10);
        $bar->start();

        if (!$skipDownload) {
            $this->withProgress($bar, function () {
                $this->line("\$upgrader> curl -L \"{$this->getUrl()}\" | tar -xzv");
                $process = Process::fromShellCommandline("curl -L \"{$this->getUrl()}\" | tar -xzvf");
                $process->run(function ($type, $buffer) {
                    $this->{$type === Process::ERR ? 'error' : 'line'}($buffer);
                });
            });
        }

        $this->withProgress($bar, function () {
            $this->line('$upgrader> php artisan down');
            $this->call('down');
        });

        $this->withProgress($bar, function () {
            $this->line('$upgrader> chmod -R 755 storage bootstrap/cache');
            $process = new Process(['chmod', '-R', '755', 'storage', 'bootstrap/cache']);
            $process->run(function ($type, $buffer) {
                $this->{$type === Process::ERR ? 'error' : 'line'}($buffer);
            });
        });

        $this->withProgress($bar, function () {
            $command = ['composer', 'install', '--no-ansi'];
            if (config('app.env') === 'production' && !config('app.debug')) {
                $command[] = '--optimize-autoloader';
                $command[] = '--no-dev';
            }

            $this->line('$upgrader> ' . implode(' ', $command));
            $process = new Process($command);
            $process->run(function ($type, $buffer) {
                $this->line($buffer);
            });
        });

        /** @var \Illuminate\Foundation\Application $app */
        $app = require __DIR__ . '/../../../bootstrap/app.php';
        /** @var \Pterodactyl\Console\Kernel $kernel */
        $kernel = $app->make(Kernel::class);
        $kernel->bootstrap();
        $this->setLaravel($app);

        $this->withProgress($bar, function () {
            $this->line('$upgrader> php artisan view:clear');
            $this->call('view:clear');
        });

        $this->withProgress($bar, function () {
            $this->line('$upgrader> php artisan config:clear');
            $this->call('config:clear');
        });

        $this->withProgress($bar, function () {
            $this->line('$upgrader> php artisan migrate --seed --force');
            $this->call('migrate', ['--seed' => '', '--force' => '']);
        });

        $this->withProgress($bar, function () use ($user) {
            $this->line("\$upgrader> chown -R {$user}:{$user} *");
            $process = Process::fromShellCommandline("chown -R {$user}:{$user} *");
            $process->run(function ($type, $buffer) {
                $this->{$type === Process::ERR ? 'error' : 'line'}($buffer);
            });
        });

        $this->withProgress($bar, function () {
            $this->line('$upgrader> php artisan queue:restart');
            $this->call('queue:restart');
        });

        $this->withProgress($bar, function () {
            $this->line('$upgrader> php artisan up');
            $this->call('up');
        });

        $this->newLine();
        $this->info('Finished running upgrade.');
    }

    protected function withProgress(ProgressBar $bar, Closure $callback)
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

        return sprintf(self::DEFAULT_URL, $this->option('release') ? 'download/v' . $this->option('release') : 'latest/download');
    }
}
