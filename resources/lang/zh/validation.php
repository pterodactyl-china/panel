<?php

declare(strict_types=1);

/**
 * Pterodactyl CHINA - Panel
 * 简体中文语言包，翻译与维护：Pterodactyl China
 * Copyright (c) 2018 - 2026 ValiantShishu <vlssu@vlssu.com>.
 *
 * This software is licensed under the terms of the MIT license.
 * https://opensource.org/licenses/MIT
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines contain the default error messages used by
    | the validator class. Some of these rules have multiple versions such
    | as the size rules. Feel free to tweak each of these messages here.
    |
    */

    'accepted' => '您必须接受 :attribute。',
    'active_url' => ':attribute 不是有效的网址。',
    'after' => ':attribute 必须晚于 :date。',
    'after_or_equal' => ':attribute 必须等于或晚于 :date。',
    'alpha' => ':attribute 只能由字母组成。',
    'alpha_dash' => ':attribute 只能由字母、数字、短划线(-)和下划线(_)组成。',
    'alpha_num' => ':attribute 只能由字母和数字组成。',
    'array' => ':attribute 必须是一个数组。',
    'before' => ':attribute 必须早于 :date。',
    'before_or_equal' => ':attribute 必须等于或早于 :date。',
    'between' => [
        'numeric' => ':attribute 必须在 :min 到 :max 之间。',
        'file' => ':attribute 大小必须在 :min 到 :max KB 之间。',
        'string' => ':attribute 长度必须在 :min 到 :max 个字符之间。',
        'array' => ':attribute 必须包含 :min 到 :max 个元素。',
    ],
    'boolean' => ':attribute 必须为布尔值。',
    'confirmed' => ':attribute 两次输入不一致。',
    'date' => ':attribute 不是一个有效的日期。',
    'date_format' => ':attribute 的格式必须为 :format。',
    'different' => ':attribute 和 :other 必须不同。',
    'digits' => ':attribute 必须是 :digits 位数字。',
    'digits_between' => ':attribute 必须是介于 :min 和 :max 位的数字。',
    'dimensions' => ':attribute 的图片尺寸不符合要求。',
    'distinct' => ':attribute 已经存在。',
    'email' => ':attribute 必须是有效的电子邮箱地址。',
    'exists' => ':attribute 不存在。',
    'file' => ':attribute 必须是文件。',
    'filled' => ':attribute 不能为空。',
    'image' => ':attribute 必须是图片。',
    'in' => '所选的 :attribute 无效。',
    'in_array' => ':attribute 在 :other 中不存在。',
    'integer' => ':attribute 必须是整数。',
    'ip' => ':attribute 必须是有效的 IP 地址。',
    'json' => ':attribute 必须是正确的 JSON 格式。',
    'max' => [
        'numeric' => ':attribute 不能大于 :max。',
        'file' => ':attribute 大小不能超过 :max KB。',
        'string' => ':attribute 长度不能超过 :max 个字符。',
        'array' => ':attribute 最多只能包含 :max 个元素。',
    ],
    'mimes' => ':attribute 必须是 :values 类型的文件。',
    'mimetypes' => ':attribute 必须是 :values 类型的文件。',
    'min' => [
        'numeric' => ':attribute 不能小于 :min。',
        'file' => ':attribute 大小不能小于 :min KB。',
        'string' => ':attribute 长度至少为 :min 个字符。',
        'array' => ':attribute 至少包含 :min 个元素。',
    ],
    'not_in' => '所选的 :attribute 无效。',
    'numeric' => ':attribute 必须是一个数字。',
    'present' => ':attribute 必须存在。',
    'regex' => ':attribute 格式不正确。',
    'required' => ':attribute 不能为空。',
    'required_if' => '当 :other 为 :value 时 :attribute 不能为空。',
    'required_unless' => '当 :other 不为 :values 时 :attribute 不能为空。',
    'required_with' => '当 :values 存在时 :attribute 不能为空。',
    'required_with_all' => '当 :values 存在时 :attribute 不能为空。',
    'required_without' => '当 :values 不存在时 :attribute 不能为空。',
    'required_without_all' => '当 :values 都不存在时 :attribute 不能为空。',
    'same' => ':attribute 和 :other 必须相同。',
    'size' => [
        'numeric' => ':attribute 大小必须为 :size。',
        'file' => ':attribute 大小必须为 :size KB。',
        'string' => ':attribute 长度必须为 :size 个字符。',
        'array' => ':attribute 必须包含 :size 个元素。',
    ],
    'string' => ':attribute 必须是一个字符串。',
    'timezone' => ':attribute 必须是有效的时区。',
    'unique' => ':attribute 已经存在。',
    'uploaded' => ':attribute 上传失败。',
    'url' => ':attribute 格式不正确。',

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | The following language lines are used to swap attribute place-holders
    | with something more reader friendly such as E-Mail Address instead
    | of "email". This simply helps us make messages a little cleaner.
    |
    */

    'attributes' => [],

    // Internal validation logic for Pterodactyl
    'internal' => [
        'variable_value' => ':env 变量',
        'invalid_password' => '提供的密码对此帐户无效。',
    ],
];
