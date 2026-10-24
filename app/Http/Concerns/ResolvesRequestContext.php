<?php

declare(strict_types=1);

namespace Pterodactyl\Http\Concerns;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use LogicException;
use Pterodactyl\Models\User;

trait ResolvesRequestContext
{
    protected function authenticatedUser(Request $request): User
    {
        return $request->user() ?? throw new AuthenticationException('此接口需要已登录用户。');
    }

    /**
     * @return Route
     */
    protected function resolvedRoute(Request $request)
    {
        return $request->route() ?? throw new LogicException('请求中间件需要已解析的路由。');
    }
}
