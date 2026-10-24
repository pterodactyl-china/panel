<?php

declare(strict_types=1);

namespace Pterodactyl\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;
use Pterodactyl\Services\Extensions\ExtensionSettingValueGuard;
use UnexpectedValueException;

/**
 * The value of a text, password, number, toggle or select extension setting has
 * to match the field's type, whatever rules the definition adds on top.
 */
final readonly class ValidExtensionSettingType implements ValidationRule
{
    /** @param list<string|int|bool> $choices the declared select option values */
    public function __construct(private string $field, private array $choices = []) {}

    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        try {
            ExtensionSettingValueGuard::assertValue($value);
            $valid = ExtensionSettingValueGuard::fitsField($this->field, $value, $this->choices);
        } catch (UnexpectedValueException) {
            $valid = false;
        }

        if (! $valid) {
            $fail(match ($this->field) {
                'number' => ':attribute 必须是数字。',
                'toggle' => ':attribute 必须为 true 或 false。',
                'select' => '所选的 :attribute 不在可选范围内。',
                default => ':attribute 必须是文本。',
            });
        }
    }
}
