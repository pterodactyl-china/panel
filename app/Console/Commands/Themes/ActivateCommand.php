<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Themes;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Pterodactyl\Contracts\Themes\ActivatesThemes;
use Pterodactyl\Exceptions\Extensions\InvalidExtensionException;

#[Description('将已安装且已启用的主题设为当前主题。')]
#[Signature('p:theme:activate {id : 主题标识符，或「classic」。}')]
class ActivateCommand extends Command
{
    public function handle(ActivatesThemes $themes): int
    {
        try {
            $themes->activate($this->argument('id'));
        } catch (InvalidExtensionException $invalidExtensionException) {
            $this->components->error($invalidExtensionException->getMessage());

            return self::FAILURE;
        }

        $this->components->info(sprintf('主题「%s」已激活。', $this->argument('id')));

        return self::SUCCESS;
    }
}
