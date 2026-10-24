/** `null` while the input is empty. */
export type NumberInputValue = number | null;

export const requiredNumber =
    (message: string, check?: (value: number) => string | undefined) =>
    ({ value }: { value: NumberInputValue }): string | undefined =>
        value === null ? message : check?.(value);

export const submittedNumber = (value: NumberInputValue): number => {
    if (value === null) {
        throw new Error('必填的数字输入为空时被提交。');
    }

    return value;
};
