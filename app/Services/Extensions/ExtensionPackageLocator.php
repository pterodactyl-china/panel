<?php

declare(strict_types=1);

namespace Pterodactyl\Services\Extensions;

use Closure;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Pterodactyl\Exceptions\Extensions\InvalidExtensionException;
use Throwable;
use ZipArchive;

class ExtensionPackageLocator
{
    public const int MAX_ARCHIVE_ENTRIES = 5000;

    public const int MAX_ARCHIVE_UNCOMPRESSED_BYTES = 200 * 1024 * 1024;

    /**
     * @template T
     *
     * @param  Closure(string): T  $callback
     * @return T
     */
    public function using(string $source, Closure $callback): mixed
    {
        $package = $this->locate($source);

        try {
            return $callback($package['directory']);
        } finally {
            if ($package['workdir'] !== null) {
                rescue(fn () => File::deleteDirectory($package['workdir']));
            }
        }
    }

    /** @return array{directory: string, workdir: string|null} */
    public function locate(string $source): array
    {
        if (is_dir($source)) {
            return ['directory' => $this->locatePackageRoot($source), 'workdir' => null];
        }

        throw_unless(is_file($source), InvalidExtensionException::class, "未找到扩展安装包：{$source}。");
        $workdir = $this->extract($source);

        try {
            return ['directory' => $this->locatePackageRoot($workdir), 'workdir' => $workdir];
        } catch (Throwable $throwable) {
            rescue(fn () => File::deleteDirectory($workdir));

            throw $throwable;
        }
    }

    private function extract(string $archive): string
    {
        $zip = new ZipArchive;
        throw_if($zip->open($archive) !== true, InvalidExtensionException::class, "无法打开压缩包 {$archive}。");

        try {
            $this->assertArchiveWithinLimits($zip, $archive);
        } catch (Throwable $throwable) {
            $zip->close();

            throw $throwable;
        }

        $workdir = storage_path('app'.DIRECTORY_SEPARATOR.'extensions-tmp'.DIRECTORY_SEPARATOR.Str::random(12));
        File::ensureDirectoryExists($workdir);

        try {
            $this->extractEntries($zip, $archive, $workdir);

            return $workdir;
        } catch (Throwable $throwable) {
            rescue(fn () => File::deleteDirectory($workdir));

            throw $throwable;
        } finally {
            $zip->close();
        }
    }

    /**
     * Extract entry by entry, counting the bytes actually written. The sizes an archive
     * declares are only a fast first check: they are written by whoever built the archive,
     * and an entry may inflate far beyond them.
     *
     * @throws InvalidExtensionException
     */
    private function extractEntries(ZipArchive $zip, string $archive, string $workdir): void
    {
        $written = 0;
        for ($index = 0; $index < $zip->numFiles; $index++) {
            $name = $zip->getNameIndex($index);
            $stat = $zip->statIndex($index);
            throw_if($name === false || $stat === false, InvalidExtensionException::class, "无法读取压缩包 {$archive} 的条目 {$index}。");

            $relative = $this->entryPath($name, $archive);
            $path = $workdir.DIRECTORY_SEPARATOR.$relative;
            if (str_ends_with($name, '/') || str_ends_with($name, '\\')) {
                File::ensureDirectoryExists($path);

                continue;
            }

            throw_if($relative === '', InvalidExtensionException::class, "压缩包 {$archive} 中存在没有名称的文件。");
            File::ensureDirectoryExists(dirname($path));
            $input = $zip->getStreamIndex($index);
            $output = fopen($path, 'wb');
            throw_if($input === false || $output === false, InvalidExtensionException::class, "无法从 {$archive} 中解压 {$name}。");

            try {
                $crc = hash_init('crc32b');
                while (($chunk = fread($input, 65536)) !== '') {
                    throw_if($chunk === false, InvalidExtensionException::class, "无法从 {$archive} 中解压 {$name}。");
                    $written += mb_strlen($chunk, '8bit');
                    throw_if($written > self::MAX_ARCHIVE_UNCOMPRESSED_BYTES, InvalidExtensionException::class, sprintf('压缩包 %s 解压后超过允许的 %d 字节。', $archive, self::MAX_ARCHIVE_UNCOMPRESSED_BYTES));
                    throw_unless(fwrite($output, $chunk) === mb_strlen($chunk, '8bit'), InvalidExtensionException::class, "无法从 {$archive} 中解压 {$name}。");
                    hash_update($crc, $chunk);
                }

                throw_unless(hexdec(hash_final($crc)) === $stat['crc'], InvalidExtensionException::class, "压缩包 {$archive} 的条目 {$name} 已损坏。");
            } finally {
                fclose($input);
                fclose($output);
            }
        }
    }

    /**
     * The entry's path relative to the extraction directory (empty for the directory itself).
     * Names that would land outside it are refused rather than rewritten.
     *
     * @throws InvalidExtensionException
     */
    private function entryPath(string $name, string $archive): string
    {
        $normalized = str_replace('\\', '/', $name);
        $segments = array_filter(explode('/', $normalized), fn (string $segment): bool => $segment !== '' && $segment !== '.');
        throw_if(
            str_starts_with($normalized, '/') || preg_match('/^[A-Za-z]:/', $normalized) === 1 || str_contains($name, "\0") || in_array('..', $segments, true),
            InvalidExtensionException::class,
            "压缩包 {$archive} 包含超出安装包范围的文件：{$name}。",
        );

        return implode(DIRECTORY_SEPARATOR, $segments);
    }

    /**
     * @throws InvalidExtensionException
     */
    private function assertArchiveWithinLimits(ZipArchive $zip, string $archive): void
    {
        throw_if($zip->numFiles > self::MAX_ARCHIVE_ENTRIES, InvalidExtensionException::class, sprintf('压缩包 %s 包含 %d 个条目，超过允许的 %d 个。', $archive, $zip->numFiles, self::MAX_ARCHIVE_ENTRIES));

        $total = 0;
        for ($index = 0; $index < $zip->numFiles; $index++) {
            $stat = $zip->statIndex($index);
            throw_if($stat === false, InvalidExtensionException::class, "无法读取压缩包 {$archive} 的条目 {$index}。");

            $total += $stat['size'];
            throw_if($total > self::MAX_ARCHIVE_UNCOMPRESSED_BYTES, InvalidExtensionException::class, sprintf('压缩包 %s 解压后超过允许的 %d 字节。', $archive, self::MAX_ARCHIVE_UNCOMPRESSED_BYTES));
        }
    }

    private function locatePackageRoot(string $directory): string
    {
        if (is_file($directory.DIRECTORY_SEPARATOR.ExtensionManifest::FILENAME)) {
            return $directory;
        }

        $candidates = glob($directory.'/*/'.ExtensionManifest::FILENAME) ?: [];
        if (count($candidates) === 1) {
            return dirname($candidates[0]);
        }

        throw new InvalidExtensionException('未能在 '.$directory.' 中找到唯一的 '.ExtensionManifest::FILENAME.'。');
    }
}
