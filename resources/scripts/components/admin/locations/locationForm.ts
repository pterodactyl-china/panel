export const validateShortCode = (value: string): string | undefined => {
    if (value.length < 1) {
        return '必须提供短代码。';
    }

    if (value.length > 60) {
        return '短代码不得超过 60 个字符。';
    }

    return undefined;
};
