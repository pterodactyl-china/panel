<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Themes;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Pterodactyl\Services\Themes\ThemeRepository;

#[Description('重新启用内置经典主题。')]
#[Signature('p:theme:reset')]
class ResetCommand extends Command
{
    public function handle(ThemeRepository $themes): int
    {
        $themes->setActive(ThemeRepository::CLASSIC);

        $this->components->info('面板已恢复为经典主题。');

        return self::SUCCESS;
    }
}
