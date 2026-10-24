<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Overrides;

use Illuminate\Foundation\Console\KeyGenerateCommand as BaseKeyGenerateCommand;

class KeyGenerateCommand extends BaseKeyGenerateCommand
{
    /**
     * Override the default Laravel key generation command to throw a warning to the user
     * if it appears that they have already generated an application encryption key.
     */
    public function handle(): void
    {
        if (! empty(config('app.key')) && $this->input->isInteractive()) {
            $this->output->warning('检测到已配置应用加密密钥。继续操作将覆盖该密钥，并导致现有加密数据损坏。除非您清楚自己在做什么，否则请勿继续。');
            if (! $this->confirm('我了解执行此命令的后果，并对加密数据丢失承担全部责任。')) {
                return;
            }

            if (! $this->confirm('确定要继续吗？更改应用加密密钥将导致数据丢失。')) {
                return;
            }
        }

        parent::handle();
    }
}
