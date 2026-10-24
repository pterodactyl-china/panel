<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Pterodactyl\Services\Helpers\SoftwareVersionService;

#[Description('显示应用、数据库与邮件配置以及面板版本。')]
#[Signature('p:info')]
class InfoCommand extends Command
{
    public function __construct(private readonly SoftwareVersionService $versionService)
    {
        parent::__construct();
    }

    /**
     * Handle execution of command.
     */
    public function handle(): void
    {
        $this->output->title('版本信息');
        $this->table([], [
            ['面板版本', config('app.version')],
            ['最新版本', $this->versionService->getPanel()],
            ['Up-to-Date', $this->versionService->isLatestPanel() ? 'Yes' : $this->formatText('No', 'bg=red')],
            ['唯一标识符', config('pterodactyl.service.author')],
        ], 'compact');

        $this->output->title('应用配置');
        $this->table([], [
            ['Environment', $this->formatText(config()->string('app.env'), config('app.env') === 'production' ? '' : 'bg=red')],
            ['调试模式', $this->formatText(config('app.debug') ? 'Yes' : 'No', config('app.debug') ? 'bg=red' : '')],
            ['安装地址', config('app.url')],
            ['安装目录', base_path()],
            ['Timezone', config('app.timezone')],
            ['缓存驱动', config('cache.default')],
            ['队列驱动', config('queue.default')],
            ['会话驱动', config('session.driver')],
            ['文件系统驱动', config('filesystems.default')],
            ['默认主题', config('themes.active')],
            ['Proxies', config('trustedproxies.proxies')],
        ], 'compact');

        $this->output->title('数据库配置');
        $driver = config()->string('database.default');
        $this->table([], [
            ['Driver', $driver],
            ['Host', config("database.connections.$driver.host")],
            ['Port', config("database.connections.$driver.port")],
            ['Database', config("database.connections.$driver.database")],
            ['Username', config("database.connections.$driver.username")],
        ], 'compact');

        // TODO: Update this to handle other mail drivers
        $this->output->title('邮件配置');
        $this->table([], [
            ['Driver', config('mail.default')],
            ['Host', config('mail.mailers.smtp.host')],
            ['Port', config('mail.mailers.smtp.port')],
            ['Username', config('mail.mailers.smtp.username')],
            ['发件地址', config('mail.from.address')],
            ['发件人名称', config('mail.from.name')],
            ['Encryption', config('mail.mailers.smtp.encryption')],
        ], 'compact');
    }

    /**
     * Format output in a Name: Value manner.
     */
    private function formatText(string $value, string $opts = ''): string
    {
        if ($opts === '') {
            return $value;
        }

        return sprintf('<%s>%s</>', $opts, $value);
    }
}
