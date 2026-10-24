<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Extensions;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Pterodactyl\Exceptions\Extensions\InvalidExtensionException;
use Pterodactyl\Services\Extensions\ExtensionAssetPublisher;
use Pterodactyl\Services\Extensions\ExtensionComposerInspector;
use Pterodactyl\Services\Extensions\ExtensionManifest;
use Pterodactyl\Services\Extensions\ExtensionManifestValidator;
use Pterodactyl\Services\Themes\ThemeRepository;
use ZipArchive;

#[Description('将已构建扩展的运行时文件打包为 .pteroext 归档。')]
#[Signature('p:extension:pack
                            {path : 已解压扩展的路径。}
                            {--output= : 归档文件名。}
                            {--force : 覆盖已存在的归档。}
                            {--sourcemaps : 包含 *.map 文件，其中可能嵌入完整源码。}')]
class PackCommand extends Command
{
    public function handle(ExtensionManifestValidator $validator, ExtensionAssetPublisher $assets, ExtensionComposerInspector $composer, ThemeRepository $themes): int
    {
        try {
            $manifest = $validator->fromDirectory($this->argument('path'));
            throw_if($reason = $assets->unusableBuildReason($manifest) ?? ($manifest->isTheme() ? $themes->parentBuildProblem($manifest) : null), InvalidExtensionException::class, $reason);
            foreach ($composer->warnings($manifest) as $warning) {
                $this->components->warn($warning);
            }

            $output = $this->option('output') ?: getcwd().DIRECTORY_SEPARATOR.$manifest->id.'-'.$manifest->version.'.pteroext';
            throw_if(is_file($output) && ! $this->option('force'), InvalidExtensionException::class, '归档已存在；使用 --force 覆盖。');
            File::ensureDirectoryExists(dirname($output));
            $temporary = dirname($output).DIRECTORY_SEPARATOR.'.extension-'.Str::uuid();
            $zip = new ZipArchive;
            $opened = false;
            try {
                throw_unless($zip->open($temporary, ZipArchive::CREATE | ZipArchive::EXCL) === true, InvalidExtensionException::class, '无法打开归档。');
                $opened = true;
                throw_unless($zip->addFile($manifest->path(ExtensionManifest::FILENAME), ExtensionManifest::FILENAME), InvalidExtensionException::class, '无法将扩展清单写入归档。');
                // The panel reads the PSR-4 map from composer.json when the manifest has none.
                if (is_file($manifest->path('composer.json'))) {
                    throw_unless($zip->addFile($manifest->path('composer.json'), 'composer.json'), InvalidExtensionException::class, '无法将 composer.json 写入归档。');
                }

                $directories = array_unique(['routes', 'database', 'resources', 'dist', 'vendor', ...array_values($manifest->autoload)]);
                foreach ($directories as $directory) {
                    if (! is_dir($manifest->path($directory))) {
                        continue;
                    }

                    foreach (File::allFiles($manifest->path($directory)) as $file) {
                        if ($file->isLink() || array_any(explode('/', str_replace('\\', '/', $file->getRelativePathname())), fn (string $part): bool => str_starts_with($part, '.') || in_array($part, ['node_modules', 'tests', 'test', 'coverage'], true))) {
                            continue;
                        }

                        if ($file->getExtension() === 'map' && ! $this->option('sourcemaps')) {
                            continue;
                        }

                        $relative = $directory.'/'.$file->getRelativePathname();
                        throw_unless($zip->addFile($file->getPathname(), $relative), InvalidExtensionException::class, "Unable to add {$relative} to archive.");
                    }
                }

                $icon = $manifest->iconFile();
                if ($icon !== null && is_file($manifest->path($icon)) && $zip->locateName($icon) === false) {
                    throw_unless($zip->addFile($manifest->path($icon), $icon), InvalidExtensionException::class, "Unable to add {$icon} to archive.");
                }

                throw_unless($zip->close(), InvalidExtensionException::class, '无法完成归档。');
                $opened = false;
                throw_unless(File::move($temporary, $output), InvalidExtensionException::class, '无法保存归档。');
            } finally {
                if ($opened) {
                    $zip->close();
                }

                File::delete($temporary);
            }
        } catch (InvalidExtensionException $invalidExtensionException) {
            $this->components->error($invalidExtensionException->getMessage());

            return self::FAILURE;
        }

        $this->components->info("Packaged {$manifest->id}: {$output}");

        return self::SUCCESS;
    }
}
