export const validateMountName = (value: string): string | undefined => {
    if (value.length < 2) {
        return '名称至少为 2 个字符。';
    }

    if (value.length > 64) {
        return '名称不得超过 64 个字符。';
    }

    return undefined;
};
