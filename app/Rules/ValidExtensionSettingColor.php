<?php

declare(strict_types=1);

namespace Pterodactyl\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;
use Pterodactyl\Services\Extensions\ExtensionSettingValueGuard;

final class ValidExtensionSettingColor implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ExtensionSettingValueGuard::color($value) === null) {
            $fail(':attribute 必须是十六进制颜色（例如 #1f2933）或 oklch() 颜色（例如 oklch(0.62 0.19 259.8)）。');
        }
    }
}
