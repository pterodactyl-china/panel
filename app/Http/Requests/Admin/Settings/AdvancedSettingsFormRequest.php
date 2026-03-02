<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class AdvancedSettingsFormRequest extends AdminFormRequest
{
    /**
     * Return all the rules to apply to this request's data.
     */
    public function rules(): array
    {
        return [
            'icp:enabled' => 'required|in:true,false',
            'icp:record' => 'nullable|required_if:icp:enabled,true|string|max:100',
            'icp:security_record' => 'nullable|string|max:100',
            'recaptcha:enabled' => 'required|in:true,false',
            'recaptcha:secret_key' => 'required|string|max:191',
            'recaptcha:website_key' => 'required|string|max:191',
            'pterodactyl:guzzle:timeout' => 'required|integer|between:1,60',
            'pterodactyl:guzzle:connect_timeout' => 'required|integer|between:1,60',
            'pterodactyl:client_features:allocations:enabled' => 'required|in:true,false',
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
            'pterodactyl:client_features:egg_change:mode' => 'required|in:disabled,egg_only,both',
        ];
    }

    public function attributes(): array
    {
        return [
            'icp:enabled' => 'ICP record Enabled',
            'icp:record' => '苏ICP备1000000号',
            'icp:security_record' => '苏公网安备10000000000000号',
            'recaptcha:enabled' => 'reCAPTCHA Enabled',
            'recaptcha:secret_key' => 'reCAPTCHA Secret Key',
            'recaptcha:website_key' => 'reCAPTCHA Website Key',
            'pterodactyl:guzzle:timeout' => 'HTTP Request Timeout',
            'pterodactyl:guzzle:connect_timeout' => 'HTTP Connection Timeout',
            'pterodactyl:client_features:allocations:enabled' => 'Auto Create Allocations Enabled',
            'pterodactyl:client_features:allocations:range_start' => 'Starting Port',
            'pterodactyl:client_features:allocations:range_end' => 'Ending Port',
            'pterodactyl:client_features:egg_change:mode' => 'Allow Egg Change Mode',
        ];
    }
}
