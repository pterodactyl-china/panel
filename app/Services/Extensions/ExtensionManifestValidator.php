<?php

declare(strict_types=1);

namespace Pterodactyl\Services\Extensions;

use Closure;
use Composer\Autoload\ClassLoader;
use Composer\Semver\VersionParser;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use InvalidArgumentException;
use JsonException;
use Pterodactyl\Exceptions\Extensions\InvalidExtensionException;
use Pterodactyl\Services\Themes\ThemeDefinition;
use Pterodactyl\Services\Themes\ThemeRepository;
use Pterodactyl\Services\Themes\ThemeSetting;
use UnexpectedValueException;

class ExtensionManifestValidator
{
    /** @var list<string>|null */
    private ?array $panelNamespaces = null;

    public function fromDirectory(string $directory): ExtensionManifest
    {
        $path = mb_rtrim($directory, '/\\').DIRECTORY_SEPARATOR.ExtensionManifest::FILENAME;
        throw_unless(is_file($path), InvalidExtensionException::class, '在 '.$directory.' 中找不到 '.ExtensionManifest::FILENAME.'。');

        try {
            $data = json_decode(File::get($path), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new InvalidExtensionException("{$path} 不是有效的 JSON。");
        }

        $this->validateManifestStructure($data);

        $parser = new VersionParser;
        try {
            $parser->normalize($data['version']);
            foreach ([$data['requires']['panel'] ?? null, $data['requires']['sdk'] ?? null, $data['requires']['php'] ?? null, ...array_values($data['requires']['extensions'] ?? [])] as $constraint) {
                if ($constraint !== null) {
                    $parser->parseConstraints($constraint);
                }
            }
        } catch (UnexpectedValueException $unexpectedValueException) {
            throw new InvalidExtensionException('扩展版本或依赖要求无效：'.$unexpectedValueException->getMessage(), $unexpectedValueException->getCode(), $unexpectedValueException);
        }

        foreach (array_keys($data['requires']['extensions'] ?? []) as $dependency) {
            throw_unless(preg_match(ExtensionManifest::ID_REGEX, $dependency) && $dependency !== $data['id'], InvalidExtensionException::class, '扩展依赖必须是有效的标识符，且不能指向扩展自身。');
        }

        foreach ($data['ui']['screens'] ?? [] as $screen) {
            $parameters = array_values(array_filter(explode('/', $screen['path']), fn (string $segment): bool => str_starts_with($segment, '$')));
            throw_if(in_array('$id', $parameters, true), InvalidExtensionException::class, 'id 路径参数为面板保留。');
            throw_if(count(array_unique($parameters)) !== count($parameters), InvalidExtensionException::class, '页面路径参数不能重复。');
            if (isset($screen['nav'])) {
                $names = array_map(fn (string $parameter): string => mb_substr($parameter, 1), $parameters);
                $defaults = array_keys($screen['nav']['params'] ?? []);
                throw_if(array_diff($names, $defaults) !== [] || array_diff($defaults, $names) !== [], InvalidExtensionException::class, '导航参数必须与页面路径参数完全一致。');
            }

            if (isset($screen['when'])) {
                $this->validateScreenCondition($screen['when']);
            }
        }

        $this->assertRootPrefixesAreFree($data['routes']['root'] ?? []);

        $id = $data['id'];
        throw_unless(preg_match(ExtensionManifest::ID_REGEX, $id), InvalidExtensionException::class, "扩展 ID \"{$id}\" 必须匹配 ".ExtensionManifest::ID_REGEX.'.');

        throw_if(in_array($id, ExtensionManifest::RESERVED_IDS, true), InvalidExtensionException::class, "扩展 ID \"{$id}\" 为面板保留。");

        $autoload = isset($data['autoload'])
            ? $this->normalizeAutoload($data['autoload'], 'Manifest "autoload"')
            : $this->normalizeAutoload($this->composerAutoload($directory), 'composer.json "autoload.psr-4"');
        [$uiEntry, $uiMode] = $this->normalizeUi($data['ui'] ?? null);

        $provider = $data['provider'] ?? null;
        throw_if($provider !== null && $provider === '', InvalidExtensionException::class, 'Manifest 的 "provider" 必须是类名。');

        $icon = $data['icon'] ?? null;
        throw_if($icon !== null && preg_match(ExtensionManifest::ICON_REGEX, $icon) !== 1 && preg_match(ExtensionManifest::ICON_FILE_REGEX, $icon) !== 1, InvalidExtensionException::class, 'Manifest 的 "icon" 必须是 lucide 图标名（例如 "life-buoy"），或安装包内 .png、.jpg、.webp 图片的相对路径。');

        if (($data['type'] ?? null) === 'theme') {
            $this->validateTheme($id, $data['theme'] ?? []);
        }

        return ExtensionManifest::fromValidatedData(
            directory: $directory,
            data: $data,
            autoload: $autoload,
            uiEntry: $uiEntry,
            uiMode: $uiMode,
            provider: $provider,
        );
    }

    /**
     * @phpstan-assert ExtensionManifestInput $data
     */
    private function validateManifestStructure(mixed $data): void
    {
        throw_unless(is_array($data), InvalidExtensionException::class, '扩展清单必须是 JSON 对象。');

        $validator = Validator::make($data, [
            'id' => ['required', 'string'],
            'name' => ['required', 'string'],
            'version' => ['required', 'string', 'max:64'],
            'type' => ['sometimes', 'string', Rule::in(ExtensionManifest::TYPES)],
            'description' => ['nullable', 'string'],
            'author' => ['nullable', 'string'],
            'provider' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:255'],
            'autoload' => ['sometimes', 'array'],
            'requires' => ['sometimes', 'array:panel,sdk,php,extensions'],
            'requires.panel' => ['sometimes', 'string', 'max:255'],
            'requires.sdk' => ['required_with:ui.views', 'string', 'max:255'],
            'requires.php' => ['sometimes', 'string', 'max:255'],
            'requires.extensions' => ['sometimes', 'array', 'max:64'],
            'requires.extensions.*' => ['required', 'string', 'max:255'],
            'ui' => ['sometimes', 'array'],
            'ui.entry' => ['required_with:ui', 'string'],
            'ui.mode' => ['sometimes', 'string'],
            'ui.prefix' => ['sometimes', 'prohibited_if:type,theme', 'filled', 'string', 'regex:'.ExtensionManifest::UI_PREFIX_REGEX, Rule::notIn(ExtensionManifest::RESERVED_UI_PREFIXES)],
            'ui.views' => ['sometimes', 'prohibited_if:type,theme', 'array', 'list'],
            'ui.views.*' => ['required', 'string', 'distinct:strict', 'regex:'.ExtensionManifest::VIEW_NAME_REGEX],
            'ui.screens' => ['sometimes', 'array', 'list', 'max:64'],
            'ui.screens.*' => ['required', 'array:id,area,path,nav,permission,parent,when'],
            'ui.screens.*.id' => ['required', 'string', 'max:48', 'regex:/^[a-z][a-z0-9-]*$/D', 'distinct:strict'],
            'ui.screens.*.area' => ['required', 'string', 'in:account,server,admin'],
            'ui.screens.*.path' => ['required', 'string', 'max:255', 'regex:~^[a-z][a-z0-9-]*(?:/(?:[a-z][a-z0-9-]*|\\$[a-zA-Z][a-zA-Z0-9_]*))*/?$~D'],
            'ui.screens.*.parent' => ['sometimes', 'string', 'prohibited_unless:ui.screens.*.area,admin', 'in:admin.node,admin.server,admin.egg,admin.user'],
            'ui.screens.*.nav' => ['sometimes', 'array:label,exact,params,order,group,badge,icon', 'required_array_keys:label'],
            'ui.screens.*.nav.label' => ['required_with:ui.screens.*.nav', 'string', 'max:100'],
            'ui.screens.*.nav.exact' => ['sometimes', 'boolean:strict'],
            'ui.screens.*.nav.params' => ['sometimes', 'array'],
            'ui.screens.*.nav.params.*' => ['required', 'string', 'max:255'],
            'ui.screens.*.nav.order' => ['sometimes', 'integer', 'between:-10000,10000'],
            'ui.screens.*.nav.group' => ['sometimes', 'string', 'max:100'],
            'ui.screens.*.nav.badge' => ['sometimes', 'string', 'max:32'],
            'ui.screens.*.nav.icon' => ['sometimes', 'string', 'max:64', 'regex:'.ExtensionManifest::ICON_REGEX],
            'ui.screens.*.when' => ['sometimes', 'array:eggFeatures,eggTags,match,runtime'],
            'ui.screens.*.when.eggFeatures' => ['sometimes', 'prohibited_unless:ui.screens.*.area,server', 'array:any,all'],
            'ui.screens.*.when.eggFeatures.*' => ['required', 'array', 'list', 'min:1', 'max:32'],
            'ui.screens.*.when.eggFeatures.*.*' => ['required', 'string', 'max:100'],
            'ui.screens.*.when.eggTags' => ['sometimes', 'prohibited_unless:ui.screens.*.area,server', 'array:any,all'],
            'ui.screens.*.when.eggTags.*' => ['required', 'array', 'list', 'min:1', 'max:32'],
            'ui.screens.*.when.eggTags.*.*' => ['required', 'string', 'max:100'],
            'ui.screens.*.when.match' => ['sometimes', 'string', 'in:all,any'],
            'ui.screens.*.when.runtime' => ['sometimes', 'boolean:strict'],
            'ui.screens.*.permission' => ['sometimes', 'prohibited_unless:ui.screens.*.area,server', 'array', 'list'],
            'ui.screens.*.permission.*' => ['required', 'string', 'max:100'],
            'routes' => ['sometimes', 'array:root'],
            'routes.root' => ['sometimes', 'array', 'list', 'max:8'],
            'routes.root.*' => ['required', 'string', 'distinct:strict', 'regex:'.ExtensionManifest::ROOT_PREFIX_REGEX],
            'theme' => ['sometimes', 'prohibited_unless:type,theme', 'array:extends,stylesheet,schemes,settings'],
            'theme.extends' => ['sometimes', 'string', 'regex:'.ExtensionManifest::ID_REGEX],
            'theme.stylesheet' => ['sometimes', 'nullable', 'string', Rule::in([ThemeDefinition::STYLESHEET])],
            'theme.schemes' => ['sometimes', 'array', 'list', 'min:1', 'max:2'],
            'theme.schemes.*' => ['required', 'string', 'distinct:strict', Rule::in(ThemeDefinition::SCHEMES)],
            'theme.settings' => ['sometimes', 'array', $this->keyedBy(ThemeSetting::KEY_REGEX, '主题设置的名称必须匹配 '.ThemeSetting::KEY_REGEX.'.')],
            'theme.settings.*' => ['required', 'array:type,label,default,help,tab,token,attribute,options,min,max,step,unit,maxLength'],
            'theme.settings.*.type' => ['required', 'string', Rule::in(ThemeSetting::TYPES)],
            'theme.settings.*.label' => ['required', 'string'],
            'theme.settings.*.help' => ['sometimes', 'nullable', 'string'],
            'theme.settings.*.tab' => ['sometimes', 'nullable', 'string'],
            'theme.settings.*.token' => ['sometimes', 'nullable', 'string', 'regex:'.ThemeSetting::TOKEN_REGEX],
            'theme.settings.*.attribute' => ['sometimes', 'nullable', 'string', 'regex:'.ThemeSetting::ATTRIBUTE_REGEX, Rule::notIn(ThemeSetting::RESERVED_ATTRIBUTES)],
            'theme.settings.*.options' => ['required_if:theme.settings.*.type,select', 'prohibited_unless:theme.settings.*.type,select', 'array', 'min:1', $this->keyedBy(ThemeSetting::OPTION_REGEX, '主题设置的选项必须以标识符为键，例如 "side"。')],
            'theme.settings.*.options.*' => ['required', 'string'],
            'theme.settings.*.min' => ['sometimes', 'prohibited_unless:theme.settings.*.type,number', 'numeric'],
            'theme.settings.*.max' => ['sometimes', 'prohibited_unless:theme.settings.*.type,number', 'numeric'],
            'theme.settings.*.step' => ['sometimes', 'prohibited_unless:theme.settings.*.type,number', 'numeric', 'gt:0'],
            'theme.settings.*.unit' => ['sometimes', 'prohibited_unless:theme.settings.*.type,number', 'string', 'regex:'.ThemeSetting::UNIT_REGEX],
            'theme.settings.*.maxLength' => ['sometimes', 'prohibited_unless:theme.settings.*.type,text', 'integer', 'min:1'],
        ], [
            'id.required' => 'Manifest 的 "id" 必填，且必须是字符串。',
            'id.string' => 'Manifest 的 "id" 必填，且必须是字符串。',
            'name.required' => 'Manifest 的 "name" 必填，且必须是字符串。',
            'name.string' => 'Manifest 的 "name" 必填，且必须是字符串。',
            'version.required' => 'Manifest 的 "version" 必填，且必须是字符串。',
            'version.string' => 'Manifest 的 "version" 必填，且必须是字符串。',
            'version.max' => 'Manifest 的 "version" 不能超过 64 个字符。',
            'provider.string' => 'Manifest 的 "provider" 必须是类名。',
            'icon.string' => 'Manifest 的 "icon" 必须是 lucide 图标名，或图片路径。',
            'icon.max' => 'Manifest 的 "icon" 不能超过 255 个字符。',
            'autoload.array' => 'Manifest 的 "autoload" 必须把 "Vendor\\\\Prefix\\\\" 映射到源码目录。',
            'ui.array' => 'Manifest 的 "ui" 必须是包含 "entry" 路径的对象。',
            'ui.entry.required_with' => 'Manifest 的 "ui" 必须是包含 "entry" 路径的对象。',
            'ui.entry.string' => 'Manifest 的 "ui" 必须是包含 "entry" 路径的对象。',
            'ui.mode.string' => 'Manifest 的 "ui.mode" 必须是字符串。',
            'ui.prefix.filled' => 'Manifest 的 "ui.prefix" 必须匹配 '.ExtensionManifest::UI_PREFIX_REGEX.'.',
            'ui.prefix.string' => 'Manifest 的 "ui.prefix" 必须匹配 '.ExtensionManifest::UI_PREFIX_REGEX.'.',
            'ui.prefix.regex' => 'Manifest 的 "ui.prefix" 必须匹配 '.ExtensionManifest::UI_PREFIX_REGEX.'.',
            'ui.prefix.not_in' => 'Manifest 的 "ui.prefix" 不能使用 Tailwind 变量名、主题命名空间或面板名称。',
            'requires.sdk.required_with' => '覆盖视图时必须声明 "requires.sdk" 版本约束。',
            'ui.prefix.prohibited_if' => '主题不能声明 "ui.prefix"，主题的样式由自己构建。',
            'ui.views.prohibited_if' => '主题不能声明 "ui.views"，主题应通过 defineTheme 覆盖视图。',
            'ui.views.*.regex' => 'Manifest 的 "ui.views" 必须包含视图名，例如 "server.power" 或 "page.dashboard"。',
            'theme.prohibited_unless' => '只有 "type" 为 "theme" 的包才能声明 "theme" 段。',
            'theme.stylesheet.in' => 'Manifest 的 "theme.stylesheet" 必须为 "'.ThemeDefinition::STYLESHEET.'"。',
            'theme.settings.*.token.regex' => '主题设置的令牌必须是自定义属性名，例如 "--accent"。',
            'theme.settings.*.attribute.regex' => '主题设置的属性必须是 data 属性，例如 "data-density"。',
            'theme.settings.*.attribute.not_in' => '主题设置的属性不能使用 "data-theme"，该属性由面板设置。',
            'ui.screens.*.permission.prohibited_unless' => '页面 "permission" 仅支持服务器页面。',
            'ui.screens.*.nav.icon.regex' => '导航 "icon" 必须是 lucide 图标名，例如 "life-buoy"。',
            'ui.screens.*.when.eggFeatures.prohibited_unless' => '页面 "when" 的预设规则仅支持服务器页面。',
            'ui.screens.*.when.eggTags.prohibited_unless' => '页面 "when" 的预设规则仅支持服务器页面。',
            'routes.array' => 'Manifest 的 "routes" 必须是包含 "root" 列表的对象。',
            'routes.root.*.regex' => 'Manifest "routes.root" 的前缀必须匹配 '.ExtensionManifest::ROOT_PREFIX_REGEX.'.',
            'routes.root.*.distinct' => 'Manifest 的 "routes.root" 前缀不能重复。',
        ]);

        if ($validator->fails()) {
            throw new InvalidExtensionException($validator->errors()->first());
        }
    }

    /** @return Closure(string, mixed, Closure(string): mixed): void */
    private function keyedBy(string $pattern, string $message): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) use ($pattern, $message): void {
            if (is_array($value) && array_any(array_keys($value), fn (int|string $key): bool => ! is_string($key) || preg_match($pattern, $key) !== 1)) {
                $fail($message);
            }
        };
    }

    /**
     * What the structure rules cannot express: typed numbers, distinct targets and defaults
     * that pass the same checks as a saved value.
     *
     * @param  ExtensionThemeInput  $theme
     */
    private function validateTheme(string $id, array $theme): void
    {
        $extends = $theme['extends'] ?? ThemeRepository::CLASSIC;
        throw_if($extends === $id, InvalidExtensionException::class, "主题 \"{$id}\" 不能继承自身。");

        $targets = [];
        foreach ($theme['settings'] ?? [] as $key => $setting) {
            foreach (array_filter([$setting['token'] ?? null, $setting['attribute'] ?? null]) as $target) {
                if (isset($targets[$target])) {
                    throw new InvalidExtensionException("主题设置 \"{$targets[$target]}\" 与 \"{$key}\" 都写入了 \"{$target}\"。");
                }

                $targets[$target] = $key;
            }

            $this->validateThemeSetting($key, $setting);
        }
    }

    /** @param ExtensionThemeSettingInput $setting */
    private function validateThemeSetting(string $key, array $setting): void
    {
        foreach (['min', 'max', 'step'] as $limit) {
            throw_if(array_key_exists($limit, $setting) && ! is_int($setting[$limit]) && ! is_float($setting[$limit]), InvalidExtensionException::class, "主题设置 \"{$key}\" 的 \"{$limit}\" 必须是数字。");
        }

        $this->validateThemeDefault(ThemeSetting::fromValidatedData($key, $setting));
    }

    private function validateThemeDefault(ThemeSetting $setting): void
    {
        $default = $setting->default;
        $problem = match (true) {
            $setting->min !== null && $setting->max !== null && $setting->min > $setting->max => '的 "min" 大于 "max"',
            $setting->type === 'image' && $default !== null => '不能设置默认值，请到「主题」页面上传图片',
            $setting->type === 'text' && $default !== null && (! is_string($default) || mb_strlen($default) > $setting->maxLength) => "的默认值超过 {$setting->maxLength} 个字符",
            $setting->type === 'number' && (is_int($default) || is_float($default)) && (($setting->min !== null && $default < $setting->min) || ($setting->max !== null && $default > $setting->max)) => '的默认值超出了 "min" 与 "max" 的范围',
            default => null,
        };
        throw_if($problem !== null, InvalidExtensionException::class, "主题设置 \"{$setting->key}\" {$problem}。");

        try {
            $setting->definition();
        } catch (InvalidArgumentException $invalidArgumentException) {
            throw new InvalidExtensionException("主题设置 \"{$setting->key}\"：{$invalidArgumentException->getMessage()}", $invalidArgumentException->getCode(), previous: $invalidArgumentException);
        }
    }

    /**
     * A condition has to restrict something: an empty rule, an empty matcher, or a
     * combinator with nothing to combine is a manifest mistake rather than "always".
     *
     * @param  ExtensionScreenCondition  $when
     */
    private function validateScreenCondition(array $when): void
    {
        $rules = array_intersect_key($when, ['eggFeatures' => true, 'eggTags' => true]);
        throw_if($rules === [] && ($when['runtime'] ?? false) !== true, InvalidExtensionException::class, '页面 "when" 必须声明预设规则，或将 "runtime" 设为 true。');
        throw_if(isset($when['match']) && count($rules) < 2, InvalidExtensionException::class, '"when.match" 同时组合了 "eggFeatures" 与 "eggTags"，两者都必须提供。');
        foreach ($rules as $name => $matcher) {
            throw_if($matcher === [], InvalidExtensionException::class, "页面 \"when.{$name}\" 必须列出 \"any\" 或 \"all\" 的值。");
        }
    }

    /**
     * A claimed top-level prefix must not shadow anything the panel already serves: the
     * SPA's client-side routes, the first segment of any registered core route, or a
     * file or directory in the public web root. Routes of extensions are named
     * `extensions.*` and are skipped - claims between extensions are compared when one
     * is enabled, not here.
     *
     * @param  list<string>  $prefixes
     */
    private function assertRootPrefixesAreFree(array $prefixes): void
    {
        if ($prefixes === []) {
            return;
        }

        $reserved = array_fill_keys(ExtensionManifest::RESERVED_ROOT_PREFIXES, true);
        foreach (Route::getRoutes()->getRoutes() as $route) {
            $segment = explode('/', mb_ltrim($route->uri(), '/'))[0];
            if ($segment !== '' && ! str_contains($segment, '{') && ! str_starts_with($route->getName() ?? '', 'extensions.')) {
                $reserved[mb_strtolower($segment)] = true;
            }
        }

        foreach ($prefixes as $prefix) {
            throw_if(isset($reserved[$prefix]) || File::exists(public_path($prefix)), InvalidExtensionException::class, "根路径前缀 \"/{$prefix}\" 为面板保留。");
        }
    }

    /**
     * The PSR-4 map of the package's composer.json, which Composer and editors read. It is
     * used when extension.json declares no `autoload` of its own.
     *
     * @return array<mixed>
     */
    private function composerAutoload(string $directory): array
    {
        $path = mb_rtrim($directory, '/\\').DIRECTORY_SEPARATOR.'composer.json';
        if (! is_file($path)) {
            return [];
        }

        try {
            $composer = json_decode(File::get($path), true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new InvalidExtensionException("{$path} 不是有效的 JSON。");
        }

        throw_unless(is_array($composer), InvalidExtensionException::class, "{$path} 不是有效的 JSON。");

        $psr4 = data_get($composer, 'autoload.psr-4', []);
        throw_unless(is_array($psr4), InvalidExtensionException::class, 'composer.json 的 "autoload.psr-4" 必须把 "Vendor\\\\Prefix\\\\" 映射到源码目录。');

        return $psr4;
    }

    /**
     * @param  array<mixed>  $autoload
     * @return array<string, string>
     */
    private function normalizeAutoload(array $autoload, string $field): array
    {
        $normalized = [];
        foreach ($autoload as $prefix => $src) {
            // Composer also maps a prefix to a list of directories; a list of one is the same map.
            if (is_array($src) && count($src) === 1 && array_is_list($src)) {
                $src = $src[0];
            }

            throw_if(! is_string($prefix) || ! is_string($src) || preg_match(ExtensionManifest::NAMESPACE_REGEX, $prefix) !== 1, InvalidExtensionException::class, $field.' 必须把 "Vendor\\\\Prefix\\\\" 映射到源码目录。');

            $reserved = array_find($this->panelNamespaces(), fn (string $namespace): bool => ExtensionManifest::namespacesOverlap($prefix, $namespace));
            throw_if($reserved !== null, InvalidExtensionException::class, "{$field} 中的命名空间 \"{$prefix}\" 与面板已自动加载的 \"{$reserved}\" 重叠。");

            throw_if(str_starts_with($src, '/') || str_contains($src, '..'), InvalidExtensionException::class, $field.' 的目录必须是安装包内的相对路径。');

            $normalized[$prefix] = mb_trim(str_replace('\\', '/', $src), '/');
        }

        return $normalized;
    }

    /**
     * The namespaces of the panel, its framework and every PSR-4 prefix the panel's own
     * Composer autoloader maps. Extension class loaders run after the panel's, so they
     * never replace a class it can load, but a claim here would let an extension add
     * classes to those namespaces that the panel looks up by name.
     *
     * @return list<string>
     */
    private function panelNamespaces(): array
    {
        if ($this->panelNamespaces !== null) {
            return $this->panelNamespaces;
        }

        // Extensions and tools such as Herd's dump helper register Composer loaders of their
        // own; the panel's is the one that loads the panel namespace, which no extension may claim.
        $loader = array_find(ClassLoader::getRegisteredLoaders(), fn (ClassLoader $loader): bool => isset($loader->getPrefixesPsr4()['Pterodactyl\\']));

        return $this->panelNamespaces = array_values(array_unique([
            ...ExtensionManifest::RESERVED_NAMESPACES,
            ...array_keys($loader?->getPrefixesPsr4() ?? []),
        ]));
    }

    /**
     * @param  array{entry: string, mode?: string, prefix?: string, screens?: list<ExtensionScreenDefinition>, views?: list<string>}|null  $ui
     * @return array{0: string|null, 1: string}
     */
    private function normalizeUi(mixed $ui): array
    {
        if ($ui === null) {
            return [null, 'native'];
        }

        $uiEntry = str_replace('\\', '/', $ui['entry']);
        throw_if(str_starts_with($uiEntry, '/') || str_contains($uiEntry, '..'), InvalidExtensionException::class, 'Manifest 的 "ui.entry" 必须是安装包内的相对路径。');

        throw_if($uiEntry !== ExtensionManifest::UI_ENTRY, InvalidExtensionException::class, 'Manifest 的 "ui.entry" 必须为 "'.ExtensionManifest::UI_ENTRY.'"。');

        $uiMode = $ui['mode'] ?? 'native';
        throw_if($uiMode !== 'native', InvalidExtensionException::class, "不支持的 ui.mode \"{$uiMode}\"，此面板仅支持：native。");

        return [$uiEntry, $uiMode];
    }
}
