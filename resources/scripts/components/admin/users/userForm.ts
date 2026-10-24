import type { AdminUser, UserValues } from '@/api/admin/users/queries';
import { requiredWithMaxLength } from '@/components/form/validators';
import { initialExtensionValues } from '@/extensions/forms';

export const userFormValues = (user: AdminUser): UserValues => ({
    email: user.attributes.email,
    username: user.attributes.username,
    nameFirst: user.attributes.first_name ?? '',
    nameLast: user.attributes.last_name ?? '',
    password: '',
    rootAdmin: user.attributes.root_admin,
    language: user.attributes.language,
    extensions: initialExtensionValues(),
});

export const validateUserPassword = ({ value }: { value: string }): string | undefined => {
    if (value.length === 0) {
        return undefined;
    }

    if (value.length < 8) {
        return '密码长度至少为 8 个字符。';
    }

    if (value.length > 191) {
        return '密码不得超过 191 个字符。';
    }

    return undefined;
};

export const validateUserEmail = ({ value }: { value: string }): string | undefined => {
    if (value.length < 1) {
        return '必须提供电子邮箱地址。';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return '必须提供有效的电子邮箱地址。';
    }

    return undefined;
};

export const validateUsername = requiredWithMaxLength(191, '必须提供用户名。', '用户名不得超过 191 个字符。');

export const validateFirstName = requiredWithMaxLength(191, '必须提供名字。', '名字不得超过 191 个字符。');

export const validateLastName = requiredWithMaxLength(191, '必须提供姓氏。', '姓氏不得超过 191 个字符。');
