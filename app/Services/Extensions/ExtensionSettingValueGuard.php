<?php

declare(strict_types=1);

namespace Pterodactyl\Services\Extensions;

use Closure;
use Illuminate\Contracts\Validation\Rule as RuleContract;
use Illuminate\Contracts\Validation\ValidationRule as ValidationRuleContract;
use Illuminate\Support\Facades\Crypt;
use Stringable;
use UnexpectedValueException;

final class ExtensionSettingValueGuard
{
    /**
     * Hex with optional alpha, or a numeric oklch() triple with optional alpha.
     */
    private const string COLOR_PATTERN = '/\A(?:#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|oklch\((?&n)%? (?&n)%? (?&n)(?:deg)?(?: \/ (?&n)%?)?\))\z(?(DEFINE)(?<n>\d{1,3}(?:\.\d{1,6})?|\.\d{1,6}))/';

    /**
     * A stored setting, decrypted first when it is a secret.
     */
    public static function decode(string $encoded, bool $secret = false): mixed
    {
        $value = json_decode($encoded, true, flags: JSON_THROW_ON_ERROR);
        if (! $secret) {
            return $value;
        }

        throw_unless(is_string($value), UnexpectedValueException::class, '加密的扩展设置必须是字符串。');

        return json_decode(Crypt::decryptString($value), true, flags: JSON_THROW_ON_ERROR);
    }

    public static function encode(mixed $value, bool $secret = false): string
    {
        $encoded = json_encode($value, JSON_THROW_ON_ERROR);

        return $secret ? json_encode(Crypt::encryptString($encoded), JSON_THROW_ON_ERROR) : $encoded;
    }

    /**
     * Rejects what JSON cannot hold, such as objects and uploaded files, and nesting
     * deeper than ten levels.
     */
    public static function assertValue(mixed $value, int $remainingDepth = 10): void
    {
        if (! is_array($value)) {
            throw_unless($value === null || is_scalar($value), UnexpectedValueException::class, '扩展设置的值必须是 JSON 标量或数组。');

            return;
        }

        throw_if($remainingDepth === 0, UnexpectedValueException::class, '扩展设置的值最多嵌套 10 层。');

        foreach ($value as $item) {
            self::assertValue($item, $remainingDepth - 1);
        }
    }

    /** @phpstan-assert array<string, mixed> $value */
    public static function assertValues(mixed $value): void
    {
        throw_unless(is_array($value), UnexpectedValueException::class, '扩展设置必须是对象。');

        foreach ($value as $key => $item) {
            throw_unless(is_string($key), UnexpectedValueException::class, '扩展设置的名称必须是字符串。');

            self::assertValue($item);
        }
    }

    /**
     * Whether a value fits an extension field: a string, number, boolean or null, or a
     * list of those.
     *
     * @phpstan-assert-if-true ExtensionFieldValue $value
     */
    public static function isFieldValue(mixed $value): bool
    {
        if (! is_array($value)) {
            return $value === null || is_scalar($value);
        }

        if (! array_is_list($value)) {
            return false;
        }

        foreach ($value as $item) {
            if ($item !== null && ! is_scalar($item)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @phpstan-assert ExtensionFieldValue $value
     *
     * @return ExtensionFieldValue
     */
    public static function fieldValue(mixed $value): bool|float|int|string|array|null
    {
        throw_unless(self::isFieldValue($value), UnexpectedValueException::class, '扩展字段的值必须是字符串、数字、布尔值、null 或它们的列表。');

        return $value;
    }

    /**
     * @phpstan-assert ExtensionFieldValues $value
     *
     * @return ExtensionFieldValues
     */
    public static function fieldValues(mixed $value): array
    {
        throw_unless(is_array($value), UnexpectedValueException::class, '扩展字段的值必须是以字段名为键的数组。');

        $values = [];
        foreach ($value as $key => $item) {
            throw_unless(is_string($key), UnexpectedValueException::class, '扩展字段的名称必须是字符串。');
            $values[$key] = self::fieldValue($item);
        }

        return $values;
    }

    /**
     * The validation rules an extension's Fields declare: rule strings, objects or closures,
     * or lists of them, keyed by field.
     *
     * @phpstan-assert ValidationRules $value
     *
     * @return ValidationRules
     */
    public static function validationRules(mixed $value): array
    {
        throw_unless(is_array($value), UnexpectedValueException::class, '扩展字段规则的每一项都必须是以字段名为键的数组。');

        $rules = [];
        foreach ($value as $field => $rule) {
            throw_unless(is_string($field), UnexpectedValueException::class, '扩展字段规则必须以字段名为键。');
            $rules[$field] = is_array($rule) ? array_values(array_map(self::validationRule(...), $rule)) : self::validationRule($rule);
        }

        return $rules;
    }

    /**
     * @phpstan-assert array<string, string> $value
     *
     * @return array<string, string>
     */
    public static function stringMap(mixed $value): array
    {
        throw_unless(is_array($value), UnexpectedValueException::class, '扩展字段的属性与消息必须是字符串数组。');

        $strings = [];
        foreach ($value as $key => $string) {
            throw_unless(is_string($key) && is_string($string), UnexpectedValueException::class, '扩展字段的属性与消息必须是字符串数组。');
            $strings[$key] = $string;
        }

        return $strings;
    }

    /**
     * The canonical form of a colour setting (lower case, single spaces), or
     * null when the value is not a colour this panel accepts.
     */
    public static function color(mixed $value): ?string
    {
        if (! is_string($value) || mb_strlen($value) > 64) {
            return null;
        }

        $color = preg_replace(['/\s+/', '/ ?\/ ?/'], [' ', ' / '], mb_strtolower(mb_trim($value))) ?? '';
        $color = str_replace(['( ', ' )'], ['(', ')'], $color);

        return preg_match(self::COLOR_PATTERN, $color) === 1 ? $color : null;
    }

    /**
     * A multi-line text setting with its line endings normalized, or null when
     * the value is not a string.
     */
    public static function text(mixed $value): ?string
    {
        return is_string($value) ? str_replace(["\r\n", "\r"], "\n", $value) : null;
    }

    /**
     * The string items of a list setting, in order, or null when the value is
     * not a list.
     *
     * @return list<string>|null
     */
    public static function strings(mixed $value): ?array
    {
        if (! is_array($value) || ! array_is_list($value)) {
            return null;
        }

        return array_values(array_filter($value, is_string(...)));
    }

    /**
     * The declared choices present in a multiselect value, deduplicated and in
     * declaration order, or null when the value is not a list. Anything that is
     * not a declared choice is dropped.
     *
     * @param  list<string|int>  $choices
     * @return list<string|int>|null
     */
    public static function choices(mixed $value, array $choices): ?array
    {
        if (! is_array($value) || ! array_is_list($value)) {
            return null;
        }

        $selected = [];
        foreach ($value as $item) {
            if (is_string($item) || is_int($item)) {
                $selected[(string) $item] = true;
            }
        }

        return array_values(array_filter($choices, fn (string|int $choice): bool => isset($selected[(string) $choice])));
    }

    /**
     * Whether a value has the type a text, password, number, toggle or select field
     * stores: text is a string or a number, a select value is identical to one of
     * the declared choices. Null always fits; other fields have their own checks.
     *
     * @param  list<string|int|bool>  $choices
     */
    public static function fitsField(string $field, mixed $value, array $choices = []): bool
    {
        return $value === null || match ($field) {
            'text', 'password' => is_string($value) || is_int($value) || is_float($value),
            'number' => is_int($value) || is_float($value),
            'toggle' => is_bool($value),
            'select' => in_array($value, $choices, true),
            default => true,
        };
    }

    /**
     * The stored name of an uploaded settings file, or null when the value is not one.
     */
    public static function fileReference(mixed $value): ?string
    {
        return is_string($value) && preg_match(ExtensionSettingFiles::NAME_PATTERN, $value) === 1 ? $value : null;
    }

    /**
     * @param  'string'|'number'|'boolean'|'array'|'object'|'null'|'json'  $type
     */
    public static function assertFrontendType(mixed $value, string $type): void
    {
        $valid = match ($type) {
            'string' => is_string($value),
            'number' => is_int($value) || is_float($value),
            'boolean' => is_bool($value),
            'array' => is_array($value) && array_is_list($value),
            'object' => is_array($value) && $value !== [] && array_all(array_keys($value), fn (int|string $key): bool => is_string($key)),
            'null' => $value === null,
            'json' => true,
        };
        throw_unless($valid, UnexpectedValueException::class, "扩展前端设置与其声明的 {$type} 类型不符。");
    }

    /**
     * @phpstan-assert ValidationRule $value
     *
     * @return ValidationRule
     */
    private static function validationRule(mixed $value): string|Stringable|Closure|RuleContract|ValidationRuleContract
    {
        throw_unless(is_string($value) || $value instanceof Stringable || $value instanceof Closure || $value instanceof RuleContract || $value instanceof ValidationRuleContract, UnexpectedValueException::class, '扩展字段规则必须是规则字符串、规则对象或闭包。');

        return $value;
    }
}
