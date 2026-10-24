<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Environment;

use DateTimeZone;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Str;
use Pterodactyl\Exceptions\PterodactylException;
use Pterodactyl\Traits\Commands\EnvironmentWriterTrait;

#[Description('配置面板的基础环境设置。')]
#[Signature('p:environment:setup
                            {--new-salt : 是否为 Hashids 生成新的盐值。}
                            {--author= : 在此实例上创建的服务的关联邮箱。}
                            {--url= : 本面板运行的访问地址。}
                            {--timezone= : 面板使用的时区。}
                            {--cache= : 使用的缓存驱动后端。}
                            {--session= : 使用的会话驱动后端。}
                            {--queue= : 使用的队列驱动后端。}
                            {--redis-host= : 用于连接的 Redis 主机。}
                            {--redis-pass= : 连接 Redis 使用的密码。}
                            {--redis-port= : 连接 Redis 使用的端口。}
                            {--settings-ui= : 启用或禁用设置界面。}
                            {--telemetry= : 启用或禁用匿名遥测。}')]
class AppSettingsCommand extends Command
{
    use EnvironmentWriterTrait;

    public const array CACHE_DRIVERS = [
        'redis' => 'Redis（推荐）',
        'memcached' => 'Memcached',
        'file' => '文件系统',
    ];

    public const array SESSION_DRIVERS = [
        'redis' => 'Redis（推荐）',
        'memcached' => 'Memcached',
        'database' => 'MySQL 数据库',
        'file' => '文件系统',
        'cookie' => 'Cookie',
    ];

    public const array QUEUE_DRIVERS = [
        'redis' => 'Redis（推荐）',
        'database' => 'MySQL 数据库',
        'sync' => '同步',
    ];

    /** @var array<string, EnvironmentValue> */
    protected array $variables = [];

    /**
     * AppSettingsCommand constructor.
     */
    public function __construct(private Kernel $console)
    {
        parent::__construct();
    }

    /**
     * Handle command execution.
     *
     * @throws PterodactylException
     */
    public function handle(): int
    {
        if (empty(config('hashids.salt')) || $this->option('new-salt')) {
            $this->variables['HASHIDS_SALT'] = Str::random(20);
        }

        $this->output->comment('请提供本面板导出的预设所使用的邮箱地址，需为有效邮箱。');
        $this->variables['APP_SERVICE_AUTHOR'] = $this->answer(fn () => $this->option('author') ?? $this->ask(
            '预设作者邮箱',
            $this->configured('pterodactyl.service.author', 'unknown@unknown.com')
        ));

        if (! filter_var($this->variables['APP_SERVICE_AUTHOR'], FILTER_VALIDATE_EMAIL)) {
            $this->output->error('提供的服务作者邮箱无效。');

            return 1;
        }

        $this->output->comment('应用地址必须以 https:// 或 http:// 开头（取决于是否使用 SSL）。若未包含协议，邮件及其他内容中的链接将指向错误位置。');
        $url = $this->answer(fn () => $this->option('url') ?? $this->ask(
            '应用地址',
            $this->configured('app.url', 'https://example.com')
        ));
        $this->variables['APP_URL'] = $url;

        $this->output->comment('时区需为 PHP 支持的时区之一，可参考 https://php.net/manual/zh/timezones.php。');
        $this->variables['APP_TIMEZONE'] = $this->answer(fn () => $this->option('timezone') ?? $this->anticipate(
            '应用时区',
            DateTimeZone::listIdentifiers(),
            $this->configured('app.timezone')
        ));

        $selected = config()->string('cache.default', 'redis');
        $this->variables['CACHE_DRIVER'] = $this->answer(fn () => $this->option('cache') ?? $this->choice(
            '缓存驱动',
            self::CACHE_DRIVERS,
            array_key_exists($selected, self::CACHE_DRIVERS) ? $selected : null
        ));

        $selected = config()->string('session.driver', 'redis');
        $this->variables['SESSION_DRIVER'] = $this->answer(fn () => $this->option('session') ?? $this->choice(
            '会话驱动',
            self::SESSION_DRIVERS,
            array_key_exists($selected, self::SESSION_DRIVERS) ? $selected : null
        ));

        $selected = config()->string('queue.default', 'redis');
        $this->variables['QUEUE_CONNECTION'] = $this->answer(fn () => $this->option('queue') ?? $this->choice(
            '队列驱动',
            self::QUEUE_DRIVERS,
            array_key_exists($selected, self::QUEUE_DRIVERS) ? $selected : null
        ));

        if (($this->option('settings-ui')) !== null) {
            $this->variables['APP_ENVIRONMENT_ONLY'] = $this->option('settings-ui') === 'true' ? 'false' : 'true';
        } else {
            $this->variables['APP_ENVIRONMENT_ONLY'] = $this->confirm('是否启用基于界面的设置编辑器？', true) ? 'false' : 'true';
        }

        $this->output->comment('关于遥测数据与采集的详细信息，请参考 https://pterodactyl.io/docs/v2/panel/additional-configuration#telemetry。');
        if (($this->option('telemetry')) !== null) {
            $this->variables['PTERODACTYL_TELEMETRY_ENABLED'] = $this->option('telemetry') === 'true' ? 'true' : 'false';
        } else {
            $this->variables['PTERODACTYL_TELEMETRY_ENABLED'] = $this->confirm(
                '是否发送匿名遥测数据？',
                config()->boolean('pterodactyl.telemetry.enabled', true)
            ) ? 'true' : 'false';
        }

        // Make sure session cookies are set as "secure" when using HTTPS
        if ($url !== null && str_starts_with($url, 'https://')) {
            $this->variables['SESSION_SECURE_COOKIE'] = 'true';
        }

        $this->checkForRedis();
        $this->writeToEnvironment($this->variables);

        $this->info($this->console->output());

        return 0;
    }

    /**
     * Check if redis is selected, if so, request connection details and verify them.
     */
    private function checkForRedis(): void
    {
        $items = collect($this->variables)->filter(fn (bool|float|int|string|null $item): bool => $item === 'redis');

        // Redis was not selected, no need to continue.
        if (count($items) === 0) {
            return;
        }

        $this->output->note('您有一个或多个选项选择了 Redis 驱动，请在下方提供有效的连接信息。通常使用默认值即可，除非您修改过部署配置。');
        $this->variables['REDIS_HOST'] = $this->answer(fn () => $this->option('redis-host') ?? $this->ask(
            'Redis 主机',
            $this->configured('database.redis.default.host')
        ));

        $askForRedisPassword = true;
        if (! empty(config('database.redis.default.password'))) {
            $this->variables['REDIS_PASSWORD'] = $this->configured('database.redis.default.password');
            $askForRedisPassword = $this->confirm('检测到 Redis 已配置密码，是否要修改？');
        }

        if ($askForRedisPassword) {
            $this->output->comment('默认情况下，Redis 服务在本地运行且不对外暴露，因此没有密码。若属于这种情况，直接回车跳过即可。');
            $this->variables['REDIS_PASSWORD'] = $this->answer(fn () => $this->option('redis-pass') ?? $this->output->askHidden(
                'Redis 密码'
            ));
        }

        if (empty($this->variables['REDIS_PASSWORD'])) {
            $this->variables['REDIS_PASSWORD'] = 'null';
        }

        $this->variables['REDIS_PORT'] = $this->answer(fn () => $this->option('redis-port') ?? $this->ask(
            'Redis 端口',
            $this->configured('database.redis.default.port')
        ));
    }
}
