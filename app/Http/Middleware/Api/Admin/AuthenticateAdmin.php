<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Middleware\Api\Admin;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\Contracts\HasAbilities;
use Laravel\Sanctum\TransientToken;
use Pterodactyl\Models\ApiKey;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class AuthenticateAdmin
{
    /**
     * Allow a request through to the admin API only for a root administrator using
     * a session or an account API key. Application API keys are rejected.
     *
     * @param  Closure(Request):Response  $next
     * @return Response
     *
     * @throws AccessDeniedHttpException
     */
    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();
        throw_if(! $user || ! $user->root_admin, AccessDeniedHttpException::class, '此操作未获授权。');

        $token = $user->currentAccessToken();
        if ($token instanceof HasAbilities && ! $token instanceof TransientToken) {
            throw_if($token->key_type === ApiKey::TYPE_APPLICATION, AccessDeniedHttpException::class, '你正在不支持应用 API 密钥的接口上使用应用 API 密钥。');
        }

        return $next($request);
    }
}
