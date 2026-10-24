<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Extensions;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Pterodactyl\Contracts\Extensions\RemovesExtensions;
use Pterodactyl\Exceptions\Extensions\InvalidExtensionException;

#[Description('移除扩展的文件、已发布资源与安装记录。')]
#[Signature('p:extension:remove {id : 扩展标识符。}')]
class RemoveCommand extends Command
{
    public function handle(RemovesExtensions $installer): int
    {
        $id = $this->argument('id');

        if ($this->input->isInteractive() && ! $this->confirm("是否移除扩展「{$id}」？其文件与已发布资源将被删除。")) {
            return self::SUCCESS;
        }

        try {
            $installer->remove($id);
        } catch (InvalidExtensionException $invalidExtensionException) {
            $this->components->error($invalidExtensionException->getMessage());

            return self::FAILURE;
        }

        $this->components->info(sprintf(
            '扩展「%s」已移除。其创建的数据库表与设置保留未动。',
            $id,
        ));

        return self::SUCCESS;
    }
}
