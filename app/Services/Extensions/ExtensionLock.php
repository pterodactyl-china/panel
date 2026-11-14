<?php

declare(strict_types=1);

namespace Pterodactyl\Services\Extensions;

use Closure;
use Illuminate\Support\Facades\File;
use Pterodactyl\Exceptions\Extensions\InvalidExtensionException;

final class ExtensionLock
{
    /** @var array<string, resource> */
    private array $locks = [];

    private int $depth = 0;

    /**
     * @template T
     *
     * @param  Closure(): T  $callback
     * @return T
     */
    public function run(string $identifier, Closure $callback): mixed
    {
        $this->acquire($identifier);

        try {
            return $callback();
        } finally {
            $this->release();
        }
    }

    public function acquire(string $identifier): void
    {
        if (isset($this->locks['packages'])) {
            $this->depth++;

            return;
        }

        $directory = mb_rtrim(config()->string('extensions.directory'), '/\\').DIRECTORY_SEPARATOR.'.locks';
        File::ensureDirectoryExists($directory);
        $lock = fopen($directory.DIRECTORY_SEPARATOR.'packages', 'c');
        throw_if($lock === false, InvalidExtensionException::class, '无法锁定扩展安装包。');
        if (! flock($lock, LOCK_EX | LOCK_NB)) {
            fclose($lock);
            throw new InvalidExtensionException("另一项操作正在更新扩展，暂时无法更新 \"{$identifier}\"。");
        }

        $this->locks['packages'] = $lock;
        $this->depth = 1;
    }

    public function release(): void
    {
        if (--$this->depth > 0) {
            return;
        }

        $lock = $this->locks['packages'];
        unset($this->locks['packages']);
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}
