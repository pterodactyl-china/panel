<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Middleware\Api\Admin;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\TransientToken;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class RequireSessionAuthentication
{
    /**
     * @param  Closure(Request):Response  $next
     * @return Response
     *
     * @throws AccessDeniedHttpException
     */
    public function handle(Request $request, Closure $next): mixed
    {
        $token = $request->user()?->currentAccessToken();

        throw_unless($token instanceof TransientToken, AccessDeniedHttpException::class, '此操作只能通过已登录的面板会话执行，不能使用 API 密钥。');

        return $next($request);
    }
}
