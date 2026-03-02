@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'advanced'])

@section('title')
    高级设置
@endsection

@section('content-header')
    <h1>高级设置<small>翼龙面板的高级设置.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">管理</a></li>
        <li class="active">设置</li>
    </ol>
@endsection

@section('content')
    @yield('settings::nav')
    <div class="row">
        <div class="col-xs-12">
            <form action="" method="POST">
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">reCAPTCHA</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label class="control-label">状态</label>
                                <div>
                                    <select class="form-control" name="recaptcha:enabled">
                                        <option value="true">启用</option>
                                        <option value="false" @if(old('recaptcha:enabled', config('recaptcha.enabled')) == '0') selected @endif>禁用</option>
                                    </select>
                                    <p class="text-muted small">如果启用，登录表单和密码重置表单将进行静默验证码检查，并在需要时显示可见验证码.</p>
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">Site Key</label>
                                <div>
                                    <input type="text" required class="form-control" name="recaptcha:website_key" value="{{ old('recaptcha:website_key', config('recaptcha.website_key')) }}">
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">Secret Key</label>
                                <div>
                                    <input type="text" required class="form-control" name="recaptcha:secret_key" value="{{ old('recaptcha:secret_key', config('recaptcha.secret_key')) }}">
                                    <p class="text-muted small">用于您的网站与 Google 之间的通信。</p>
                                </div>
                            </div>
                        </div>
                        @if($showRecaptchaWarning)
                            <div class="row">
                                <div class="col-xs-12">
                                    <div class="alert alert-warning no-margin">
                                        您当前正在使用随此面板提供的 reCAPTCHA 密钥。为了提高安全性，建议专门为此网站 <a href="https://www.google.com/recaptcha/admin">生成新的 reCAPTCHA 密钥</a>.
                                    </div>
                                </div>
                            </div>
                        @endif
                    </div>
                </div>
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">ICP许可证</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label class="control-label">状态</label>
                                <div>
                                    <select class="form-control" name="icp:enabled">
                                        <option value="true">启用</option>
                                        <option value="false" @if(old('icp:enabled', config('icp.enabled')) == '0') selected @endif>禁用</option>
                                    </select>
                                    <p class="text-muted small">如果启用，会在登录页显示备案号以便在中国运营站点.</p>
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">ICP备案号</label>
                                <div>
                                    <input type="text" class="form-control" name="icp:record" value="{{ old('icp:record', config('icp.record')) }}">
                                    <p class="text-muted small">中国网络服务需要的网站经营许可证，如果您的站点架设在中国，您应向服务提供商申请 ICP 许可证并填写此参数.</p>
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">公安备案号</label>
                                <div>
                                    <input type="text" class="form-control" name="icp:security_record" value="{{ old('icp:security_record', config('icp.security_record')) }}">
                                    <p class="text-muted small">该参数可不填，但网站只要是放在中国境内（大陆地区），您就应该公安备案并填写此参数.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">HTTP 连接</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label class="control-label">连接超时</label>
                                <div>
                                    <input type="number" required class="form-control" name="pterodactyl:guzzle:connect_timeout" value="{{ old('pterodactyl:guzzle:connect_timeout', config('pterodactyl.guzzle.connect_timeout')) }}">
                                    <p class="text-muted small">在引发错误提示之前等待连接完成的时间（以秒为单位）.</p>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">请求超时</label>
                                <div>
                                    <input type="number" required class="form-control" name="pterodactyl:guzzle:timeout" value="{{ old('pterodactyl:guzzle:timeout', config('pterodactyl.guzzle.timeout')) }}">
                                    <p class="text-muted small">在引发错误提示之前等待请求完成的时间（以秒为单位）.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">自动分配创建</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label class="control-label">状态</label>
                                <div>
                                    <select class="form-control" name="pterodactyl:client_features:allocations:enabled">
                                        <option value="false">禁用</option>
                                        <option value="true" @if(old('pterodactyl:client_features:allocations:enabled', config('pterodactyl.client_features.allocations.enabled'))) selected @endif>启用</option>
                                    </select>
                                    <p class="text-muted small">如果启用，用户将可以选择通过前端自动为其服务器创建新分配.</p>
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">起始端口</label>
                                <div>
                                    <input type="number" class="form-control" name="pterodactyl:client_features:allocations:range_start" value="{{ old('pterodactyl:client_features:allocations:range_start', config('pterodactyl.client_features.allocations.range_start')) }}">
                                    <p class="text-muted small">可自动分配范围内的起始端口.</p>
                                </div>
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">结束端口</label>
                                <div>
                                    <input type="number" class="form-control" name="pterodactyl:client_features:allocations:range_end" value="{{ old('pterodactyl:client_features:allocations:range_end', config('pterodactyl.client_features.allocations.range_end')) }}">
                                    <p class="text-muted small">可自动分配范围内的结束端口.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">允许前台切换预设</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label class="control-label">模式</label>
                                <div>
                                    <select class="form-control" name="pterodactyl:client_features:egg_change:mode">
                                        <option value="disabled" @if(old('pterodactyl:client_features:egg_change:mode', config('pterodactyl.client_features.egg_change.mode')) === 'disabled') selected @endif>禁用</option>
                                        <option value="egg_only" @if(old('pterodactyl:client_features:egg_change:mode', config('pterodactyl.client_features.egg_change.mode')) === 'egg_only') selected @endif>只允许切换预设</option>
                                        <option value="both" @if(old('pterodactyl:client_features:egg_change:mode', config('pterodactyl.client_features.egg_change.mode')) === 'both') selected @endif>允许切换预设和预设组</option>
                                    </select>
                                    <p class="text-muted small">
                                        控制拥有相应权限的用户在服务器启动设置页面中可执行的切换操作：<br>
                                        <strong>只允许切换预设</strong>：显示预设组（仅作为过滤器）和预设下拉框，手动选择预设后应用；<br>
                                        <strong>允许切换预设和预设组</strong>：同时显示两个下拉框，切换预设组时自动应用第一个预设，也可手动切换预设。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="box box-primary">
                    <div class="box-footer">
                        {{ csrf_field() }}
                        <button type="submit" name="_method" value="PATCH" class="btn btn-sm btn-primary pull-right">保存</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
@endsection
