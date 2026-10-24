<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\User;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Pterodactyl\Models\User;

#[Description('为面板中的指定用户禁用两步验证。')]
#[Signature('p:user:disable2fa {--email= : 要禁用两步验证的用户的电子邮箱。}')]
class DisableTwoFactorCommand extends Command
{
    /**
     * Handle command execution process.
     */
    public function handle(): void
    {
        if ($this->input->isInteractive()) {
            $this->output->warning(trans('command/messages.user.2fa_help_text'));
        }

        $email = $this->option('email') ?? $this->ask(trans('command/messages.user.ask_email'));

        $user = User::query()->where('email', $email)->firstOrFail();
        $user->update([
            'use_totp' => false,
            'totp_secret' => null,
        ]);

        $this->info(trans('command/messages.user.2fa_disabled', ['email' => $user->email]));
    }
}
