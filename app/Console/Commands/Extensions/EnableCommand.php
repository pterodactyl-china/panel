<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Extensions;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Pterodactyl\Contracts\Extensions\SetsExtensionEnabled;
use Pterodactyl\Exceptions\Extensions\InvalidExtensionException;

#[Description('启用已安装的扩展，发布其资源并执行迁移。')]
#[Signature('p:extension:enable {id : 扩展标识符。}')]
class EnableCommand extends Command
{
    public function handle(SetsExtensionEnabled $installer): int
    {
        try {
            $installer->setEnabled($this->argument('id'), true);
        } catch (InvalidExtensionException $invalidExtensionException) {
            $this->components->error($invalidExtensionException->getMessage());

            return self::FAILURE;
        }

        $this->components->info(sprintf('Extension "%s" enabled.', $this->argument('id')));

        return self::SUCCESS;
    }
}
