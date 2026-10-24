<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Extensions;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Pterodactyl\Contracts\Extensions\InstallsExtensions;
use Pterodactyl\Exceptions\Extensions\ExtensionAlreadyInstalledException;
use Pterodactyl\Exceptions\Extensions\InvalidExtensionException;
use Pterodactyl\Services\Extensions\ExtensionDirectories;
use Pterodactyl\Services\Extensions\ExtensionManifest;
use Pterodactyl\Services\Extensions\ExtensionUrlDownloader;

#[Description('将扩展包安装到扩展目录。')]
#[Signature('p:extension:install
                            {path : .pteroext/.zip 归档、已解压扩展目录的路径，或带签名的安装地址。}
                            {--enable : 安装后启用扩展并执行其迁移。}
                            {--replace : 直接替换同 ID 的已安装扩展，不再询问。}')]
class InstallCommand extends Command
{
    public function handle(InstallsExtensions $installer, ExtensionUrlDownloader $urls, ExtensionDirectories $directories): int
    {
        $download = null;

        try {
            $path = $this->argument('path');
            // A URL is only ever a signed install URL: its signature is verified before
            // anything is downloaded, so the panel never installs from an arbitrary address.
            if ($urls->isUrl($path)) {
                $directories->assertWritable();
                $this->components->info('正在校验安装地址并下载扩展。');
                $path = $urls->download($path);
                $download = $path;
            }

            $manifest = $this->install($installer, $path);
        } catch (InvalidExtensionException $invalidExtensionException) {
            $this->components->error($invalidExtensionException->getMessage());

            return self::FAILURE;
        } finally {
            if ($download !== null) {
                rescue(fn () => File::delete($download));
            }
        }

        $this->components->info(sprintf(
            'Installed %s (%s) v%s%s.',
            $manifest->name,
            $manifest->id,
            $manifest->version,
            $this->option('enable') ? ' - enabled' : ' - enable it with p:extension:enable '.$manifest->id,
        ));

        return self::SUCCESS;
    }

    /** Replacing an installed extension needs --replace, or a yes when run interactively. */
    private function install(InstallsExtensions $installer, string $path): ExtensionManifest
    {
        $enable = (bool) $this->option('enable');

        try {
            return $installer->install($path, $enable, (bool) $this->option('replace'));
        } catch (ExtensionAlreadyInstalledException $extensionAlreadyInstalledException) {
            $installed = $extensionAlreadyInstalledException->installedVersion === null ? '已安装的副本' : 'v'.$extensionAlreadyInstalledException->installedVersion;
            $kept = $extensionAlreadyInstalledException->enabled ? ' 它将保持启用状态并执行其迁移。' : '';
            throw_unless(
                $this->input->isInteractive() && $this->components->confirm("扩展「{$extensionAlreadyInstalledException->identifier}」已安装，是否用 v{$extensionAlreadyInstalledException->version} 替换 {$installed}？{$kept}"),
                InvalidExtensionException::class,
                $extensionAlreadyInstalledException->getMessage().' 请使用 --replace 参数进行替换。',

            );

            return $installer->install($path, $enable, replace: true);
        }
    }
}
