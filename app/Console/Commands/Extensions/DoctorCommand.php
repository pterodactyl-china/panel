<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Extensions;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Pterodactyl\Exceptions\Extensions\InvalidExtensionException;
use Pterodactyl\Services\Extensions\ExtensionAssetPublisher;
use Pterodactyl\Services\Extensions\ExtensionCompatibility;
use Pterodactyl\Services\Extensions\ExtensionComposerInspector;
use Pterodactyl\Services\Extensions\ExtensionIconCatalog;
use Pterodactyl\Services\Extensions\ExtensionManifestValidator;
use Pterodactyl\Services\Extensions\ExtensionRepository;
use Pterodactyl\Services\Themes\ThemeRepository;

#[Description('安装前检查扩展或主题的清单、兼容性与已构建的前端。')]
#[Signature('p:extension:doctor {path : 已解压扩展包的路径。}')]
class DoctorCommand extends Command
{
    public function handle(ExtensionManifestValidator $validator, ExtensionCompatibility $compatibility, ExtensionRepository $extensions, ExtensionAssetPublisher $assets, ExtensionIconCatalog $icons, ExtensionComposerInspector $composer, ThemeRepository $themes): int
    {
        try {
            $manifest = $validator->fromDirectory($this->argument('path'));
            $compatibility->assertCompatible($manifest, $extensions->configuredEnabled());
            $compatibility->assertMigrationsAreUnique($manifest, $extensions->discovered());
            throw_if($reason = $assets->unusableBuildReason($manifest), InvalidExtensionException::class, $reason);
            foreach ($manifest->autoload as $directory) {
                throw_unless(is_dir($manifest->path($directory)), InvalidExtensionException::class, "自动加载目录「{$directory}」不存在。");
            }

            if ($manifest->isTheme()) {
                throw_if($problem = $themes->parentBuildProblem($manifest), InvalidExtensionException::class, $problem);
            }
        } catch (InvalidExtensionException $invalidExtensionException) {
            $this->components->error($invalidExtensionException->getMessage());

            return self::FAILURE;
        }

        foreach ($icons->unknownIcons($manifest) as $icon) {
            $this->components->warn("图标「{$icon}」不是本面板内置的 lucide 图标，将改用默认图标。");
        }

        if (($problem = $assets->iconProblem($manifest)) !== null) {
            $this->components->warn($problem.' 扩展列表将改为显示其首字母。');
        }

        foreach ($composer->warnings($manifest) as $warning) {
            $this->components->warn($warning);
        }

        $this->components->info("{$manifest->id} v{$manifest->version}：清单、兼容性、自动加载目录与构建均已通过。");

        return self::SUCCESS;
    }
}
