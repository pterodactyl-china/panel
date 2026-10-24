<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Environment;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use PDOException;
use Pterodactyl\Exceptions\PterodactylException;
use Pterodactyl\Traits\Commands\EnvironmentWriterTrait;

#[Description('配置面板的数据库设置。')]
#[Signature('p:environment:database
                            {--host= : MySQL 服务器的连接地址。}
                            {--port= : MySQL 服务器的连接端口。}
                            {--database= : 要使用的数据库。}
                            {--username= : 连接使用的用户名。}
                            {--password= : 此数据库使用的密码。}')]
class DatabaseSettingsCommand extends Command
{
    use EnvironmentWriterTrait;

    /** @var array<string, EnvironmentValue> */
    protected array $variables = [];

    /**
     * DatabaseSettingsCommand constructor.
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
        $this->output->note('强烈建议不要使用「localhost」作为数据库主机，我们观察到它常出现套接字连接问题。若需本地连接，请使用「127.0.0.1」。');
        $this->variables['DB_HOST'] = $this->answer(fn () => $this->option('host') ?? $this->ask(
            '数据库主机',
            $this->configured('database.connections.mysql.host', '127.0.0.1')
        ));

        $this->variables['DB_PORT'] = $this->answer(fn () => $this->option('port') ?? $this->ask(
            '数据库端口',
            $this->configured('database.connections.mysql.port', 3306)
        ));

        $this->variables['DB_DATABASE'] = $this->answer(fn () => $this->option('database') ?? $this->ask(
            '数据库名称',
            $this->configured('database.connections.mysql.database', 'panel')
        ));

        $this->output->note('使用「root」账户连接 MySQL 不仅极不推荐，本程序也不允许这样做。您需要为本软件单独创建一个 MySQL 用户。');
        $this->variables['DB_USERNAME'] = $this->answer(fn () => $this->option('username') ?? $this->ask(
            '数据库用户名',
            $this->configured('database.connections.mysql.username', 'pterodactyl')
        ));

        $askForMySQLPassword = true;
        if (! empty(config('database.connections.mysql.password')) && $this->input->isInteractive()) {
            $this->variables['DB_PASSWORD'] = $this->configured('database.connections.mysql.password');
            $askForMySQLPassword = $this->confirm('检测到已配置 MySQL 连接密码，是否要修改？');
        }

        if ($askForMySQLPassword) {
            $this->variables['DB_PASSWORD'] = $this->answer(fn () => $this->option('password') ?? $this->secret('数据库密码'));
        }

        try {
            $this->testMySQLConnection();
        } catch (PDOException $pdoException) {
            $this->output->error(sprintf('使用提供的凭据无法连接 MySQL 服务器，返回的错误为「%s」。', $pdoException->getMessage()));
            $this->output->error('您的连接凭据尚未保存，请提供有效的连接信息后再继续。');

            if ($this->confirm('返回重试？')) {
                DB::disconnect('_pterodactyl_command_test');

                return $this->handle();
            }

            return 1;
        }

        $this->writeToEnvironment($this->variables);

        $this->info($this->console->output());

        return 0;
    }

    /**
     * Test that we can connect to the provided MySQL instance and perform a selection.
     */
    private function testMySQLConnection(): void
    {
        config()->set('database.connections._pterodactyl_command_test', [
            'driver' => 'mysql',
            'host' => $this->variables['DB_HOST'],
            'port' => $this->variables['DB_PORT'],
            'database' => $this->variables['DB_DATABASE'],
            'username' => $this->variables['DB_USERNAME'],
            'password' => $this->variables['DB_PASSWORD'],
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'strict' => true,
        ]);

        DB::connection('_pterodactyl_command_test')->getPdo();
    }
}
