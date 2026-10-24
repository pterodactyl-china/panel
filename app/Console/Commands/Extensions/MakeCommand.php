<?php

declare(strict_types=1);

namespace Pterodactyl\Console\Commands\Extensions;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Contracts\Console\PromptsForMissingInput;
use Pterodactyl\Exceptions\Extensions\InvalidExtensionException;
use Pterodactyl\Services\Extensions\Scaffolding\ExtensionScaffolder;

#[Description('生成新扩展包的脚手架（清单、Provider、带 Scribe 注解的客户端 API 路由以及 SDK 前端），使用 --theme 时则生成主题。')]
#[Signature('p:extension:make
                            {id : 扩展标识符（小写短横线格式，例如 my-extension）。}
                            {--name= : 显示名称（默认为 id 的首字母大写形式）。}
                            {--description= : 清单描述。}
                            {--author= : 清单作者。}
                            {--prefix= : 扩展样式的 Tailwind 前缀，2-12 个小写字母（默认由 id 推导）。}
                            {--no-ui : 跳过前端脚手架（纯后端扩展）。}
                            {--theme : 生成主题脚手架：样式表、布局覆盖、皮肤、设置与测试。}
                            {--css-only : 配合 --theme：仅含 CSS 的主题，不含 JavaScript 入口。}
                            {--extends= : 配合 --theme：作为基础的主题，将生成继承其视图、皮肤、样式表与设置的子主题。}
                            {--out= : 父目录：包将创建在 <out>/<id>（默认为扩展目录）。}
                            {--force : 目标目录已存在时覆盖。}')]
class MakeCommand extends Command implements PromptsForMissingInput
{
    public function handle(ExtensionScaffolder $scaffolder): int
    {
        try {
            $target = $scaffolder->scaffold(
                id: $this->argument('id'),
                name: $this->option('name'),
                description: $this->option('description'),
                author: $this->option('author'),
                ui: ! $this->option('no-ui'),
                outDir: $this->option('out'),
                force: (bool) $this->option('force'),
                prefix: $this->option('prefix'),
                theme: (bool) $this->option('theme'),
                cssOnly: (bool) $this->option('css-only'),
                extends: $this->option('extends'),
            );
        } catch (InvalidExtensionException $invalidExtensionException) {
            $this->components->error($invalidExtensionException->getMessage());

            return self::FAILURE;
        }

        $this->components->info("扩展已生成至 {$target}。");

        foreach ($scaffolder->files() as $file) {
            $this->components->twoColumnDetail($file, '<fg=green>created</>');
        }

        $this->line('');
        $this->components->info('后续步骤：');
        // p:extension:dev builds, installs and enables the package where it is; p:extension:install takes archives.
        $this->components->bulletList(array_filter([
            $this->option('no-ui') && ! $this->option('theme') ? null : "cd {$target} && npm install",
            "php artisan p:extension:dev {$target} --enable",
            $this->option('theme') ? "php artisan p:theme:activate {$this->argument('id')}" : null,
        ]));

        return self::SUCCESS;
    }

    /** @return array<string, array<int, string>> */
    protected function promptForMissingArgumentsUsing(): array
    {
        return [
            'id' => ['扩展的标识名称是什么？', 'E.g. my-extension'],
        ];
    }
}
