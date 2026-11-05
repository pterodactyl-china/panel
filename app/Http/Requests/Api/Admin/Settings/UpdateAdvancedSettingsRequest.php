<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Requests\Api\Admin\Settings;

use Pterodactyl\Enum\Permissions;
use Pterodactyl\Http\Requests\Api\Admin\AdminApiRequest;

class UpdateAdvancedSettingsRequest extends AdminApiRequest
{
    public function permissions(): array
    {
        return [Permissions::AdminSettingsUpdate];
    }

    /**
     * Validation rules for updating advanced settings.
     *
     * @return ValidationRules
     */
    public function rules(): array
    {
        return [
            'recaptcha:enabled' => ['required', 'in:true,false'],
            'recaptcha:secret_key' => ['nullable', 'string', 'max:191'],
            'recaptcha:website_key' => ['required', 'string', 'max:191'],
            'pterodactyl:guzzle:timeout' => ['required', 'integer', 'between:1,60'],
            'pterodactyl:guzzle:connect_timeout' => ['required', 'integer', 'between:1,60'],
            'pterodactyl:client_features:allocations:enabled' => ['required', 'in:true,false'],
            'pterodactyl:client_features:allocations:range_start' => [
                'nullable',
                'required_if:pterodactyl:client_features:allocations:enabled,true',
                'integer',
                'between:1024,65535',
            ],
            'pterodactyl:client_features:allocations:range_end' => [
                'nullable',
                'required_if:pterodactyl:client_features:allocations:enabled,true',
                'integer',
                'between:1024,65535',
                'gt:pterodactyl:client_features:allocations:range_start',
            ],
        ];
    }

    /** Rename fields to be more clear in error messages. */
    public function attributes(): array
    {
        return [
            'recaptcha:enabled' => '启用 reCAPTCHA',
            'recaptcha:secret_key' => 'reCAPTCHA 密钥',
            'recaptcha:website_key' => 'reCAPTCHA 站点密钥',
            'pterodactyl:guzzle:timeout' => 'HTTP 请求超时',
            'pterodactyl:guzzle:connect_timeout' => 'HTTP 连接超时',
            'pterodactyl:client_features:allocations:enabled' => '启用自动创建端口',
            'pterodactyl:client_features:allocations:range_start' => '起始端口',
            'pterodactyl:client_features:allocations:range_end' => '结束端口',
        ];
    }

    /**
     * Pull the settings keys for persistence, including empty fields as null.
     *
     * @param  list<string>|null  $only
     * @return AdvancedSettingsData
     */
    public function normalize(?array $only = null): array
    {
        $values = [
            'recaptcha:enabled' => $this->string('recaptcha:enabled')->toString(),
            'recaptcha:website_key' => $this->string('recaptcha:website_key')->toString(),
            'pterodactyl:guzzle:timeout' => $this->integer('pterodactyl:guzzle:timeout'),
            'pterodactyl:guzzle:connect_timeout' => $this->integer('pterodactyl:guzzle:connect_timeout'),
            'pterodactyl:client_features:allocations:enabled' => $this->string('pterodactyl:client_features:allocations:enabled')->toString(),
            'pterodactyl:client_features:allocations:range_start' => $this->input('pterodactyl:client_features:allocations:range_start') === null
                ? null
                : $this->integer('pterodactyl:client_features:allocations:range_start'),
            'pterodactyl:client_features:allocations:range_end' => $this->input('pterodactyl:client_features:allocations:range_end') === null
                ? null
                : $this->integer('pterodactyl:client_features:allocations:range_end'),
        ];

        if ($this->filled('recaptcha:secret_key')) {
            $values['recaptcha:secret_key'] = $this->string('recaptcha:secret_key')->toString();
        }

        return $values;
    }
}
