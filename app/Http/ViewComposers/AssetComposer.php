<?php

namespace Pterodactyl\Http\ViewComposers;

use Illuminate\View\View;
use Pterodactyl\Services\Helpers\AssetHashService;

class AssetComposer
{
    /**
     * AssetComposer constructor.
     */
    public function __construct(private AssetHashService $assetHashService)
    {
    }

    /**
     * Provide access to the asset service in the views.
     */
    public function compose(View $view): void
    {
        $view->with('asset', $this->assetHashService);
        $view->with('siteConfiguration', [
            'name' => config('app.name') ?? 'Pterodactyl',
            'locale' => config('app.locale') ?? 'zh',
            'logo' => [
                'title' => config('logo.title') ?? '',
                'favicon' => config('logo.favicon') ?? '/favicons/favicon.ico',
                'auth' => config('logo.auth') ?? '',
            ],
            'recaptcha' => [
                'enabled' => config('recaptcha.enabled', false),
                'siteKey' => config('recaptcha.website_key') ?? '',
            ],
            'icp' => [
                'enabled' => config('icp.enabled', false),
                'record' => config('icp.record') ?? '',
                'security_record' => config('icp.security_record') ?? '',
            ],
            'allocations' => [
                'consecutiveEnabled' => config('pterodactyl.client_features.allocations.consecutive_enabled', false),
                'consecutiveLimit' => (int) config('pterodactyl.client_features.allocations.consecutive_limit', 3),
            ],
        ]);
    }
}
