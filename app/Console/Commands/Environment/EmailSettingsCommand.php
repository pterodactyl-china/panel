<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Environment;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Pterodactyl\Exceptions\PterodactylException;
use Pterodactyl\Traits\Commands\EnvironmentWriterTrait;

#[Description('设置或更新面板的邮件发送配置。')]
#[Signature('p:environment:mail
                            {--driver= : 使用的邮件驱动。}
                            {--email= : 面板发出邮件所使用的发件地址。}
                            {--from= : 面板发出邮件所显示的发件人名称。}
                            {--encryption=}
                            {--host=}
                            {--port=}
                            {--endpoint=}
                            {--username=}
                            {--password=}')]
class EmailSettingsCommand extends Command
{
    use EnvironmentWriterTrait;

    /** @var array<string, EnvironmentValue> */
    protected array $variables = [];

    /**
     * Handle command execution.
     *
     * @throws PterodactylException
     */
    public function handle(): void
    {
        $driver = $this->option('driver') ?? $this->choice(
            trans('command/messages.environment.mail.ask_driver'),
            [
                'smtp' => 'SMTP 服务器',
                'sendmail' => 'sendmail 可执行文件',
                'mailgun' => 'Mailgun 事务邮件',
                'mandrill' => 'Mandrill 事务邮件',
                'postmark' => 'Postmark 事务邮件',
            ],
            $this->configured('mail.default', 'smtp')
        );

        throw_unless(is_string($driver), PterodactylException::class, '邮件驱动必须解析为单一值。');

        $this->variables['MAIL_DRIVER'] = $driver;

        switch ($driver) {
            case 'smtp':
                $this->setupSmtpDriverVariables();
                break;
            case 'mailgun':
                $this->setupMailgunDriverVariables();
                break;
            case 'mandrill':
                $this->setupMandrillDriverVariables();
                break;
            case 'postmark':
                $this->setupPostmarkDriverVariables();
                break;
        }

        $this->variables['MAIL_FROM_ADDRESS'] = $this->answer(fn () => $this->option('email') ?? $this->ask(
            trans('command/messages.environment.mail.ask_mail_from'),
            $this->configured('mail.from.address')
        ));

        $this->variables['MAIL_FROM_NAME'] = $this->answer(fn () => $this->option('from') ?? $this->ask(
            trans('command/messages.environment.mail.ask_mail_name'),
            $this->configured('mail.from.name')
        ));

        $this->writeToEnvironment($this->variables);

        $this->line('正在更新已保存的环境配置文件。');
        $this->line('');
    }

    /**
     * Handle variables for SMTP driver.
     */
    private function setupSmtpDriverVariables(): void
    {
        $this->variables['MAIL_HOST'] = $this->answer(fn () => $this->option('host') ?? $this->ask(
            trans('command/messages.environment.mail.ask_smtp_host'),
            $this->configured('mail.mailers.smtp.host')
        ));

        $this->variables['MAIL_PORT'] = $this->answer(fn () => $this->option('port') ?? $this->ask(
            trans('command/messages.environment.mail.ask_smtp_port'),
            $this->configured('mail.mailers.smtp.port')
        ));

        $this->variables['MAIL_USERNAME'] = $this->answer(fn () => $this->option('username') ?? $this->ask(
            trans('command/messages.environment.mail.ask_smtp_username'),
            $this->configured('mail.mailers.smtp.username')
        ));

        $this->variables['MAIL_PASSWORD'] = $this->answer(fn () => $this->option('password') ?? $this->secret(
            trans('command/messages.environment.mail.ask_smtp_password')
        ));

        $encryption = $this->option('encryption') ?? $this->choice(
            trans('command/messages.environment.mail.ask_encryption'),
            ['tls' => 'TLS', 'ssl' => 'SSL', '' => 'None'],
            $this->configured('mail.mailers.smtp.encryption', 'tls')
        );

        throw_unless(is_string($encryption), PterodactylException::class, '邮件加密方式必须解析为单一值。');

        $this->variables['MAIL_ENCRYPTION'] = $encryption;
    }

    /**
     * Handle variables for mailgun driver.
     */
    private function setupMailgunDriverVariables(): void
    {
        $this->variables['MAILGUN_DOMAIN'] = $this->answer(fn () => $this->option('host') ?? $this->ask(
            trans('command/messages.environment.mail.ask_mailgun_domain'),
            $this->configured('services.mailgun.domain')
        ));

        $this->variables['MAILGUN_SECRET'] = $this->answer(fn () => $this->option('password') ?? $this->ask(
            trans('command/messages.environment.mail.ask_mailgun_secret'),
            $this->configured('services.mailgun.secret')
        ));

        $this->variables['MAILGUN_ENDPOINT'] = $this->answer(fn () => $this->option('endpoint') ?? $this->ask(
            trans('command/messages.environment.mail.ask_mailgun_endpoint'),
            $this->configured('services.mailgun.endpoint')
        ));
    }

    /**
     * Handle variables for mandrill driver.
     */
    private function setupMandrillDriverVariables(): void
    {
        $this->variables['MANDRILL_SECRET'] = $this->answer(fn () => $this->option('password') ?? $this->ask(
            trans('command/messages.environment.mail.ask_mandrill_secret'),
            $this->configured('services.mandrill.secret')
        ));
    }

    /**
     * Handle variables for postmark driver.
     */
    private function setupPostmarkDriverVariables(): void
    {
        $this->variables['MAIL_DRIVER'] = 'smtp';
        $this->variables['MAIL_HOST'] = 'smtp.postmarkapp.com';
        $this->variables['MAIL_PORT'] = '587';
        $credentials = $this->answer(fn () => $this->option('username') ?? $this->ask(
            trans('command/messages.environment.mail.ask_postmark_username'),
            $this->configured('mail.username')
        ));
        $this->variables['MAIL_USERNAME'] = $credentials;
        $this->variables['MAIL_PASSWORD'] = $credentials;
    }
}
