import { describe, expect, it } from 'vitest';
import { requiredNumber, submittedNumber } from './numberInput';

describe('requiredNumber', () => {
    const validate = requiredNumber('必须提供内存限制。', (value) => (value >= 0 ? undefined : '内存限制无效。'));

    it('rejects an empty input even when the range check would accept null', () => {
        expect(validate({ value: null })).toBe('必须提供内存限制。');
    });

    it('checks an entered number', () => {
        expect(validate({ value: 0 })).toBeUndefined();
        expect(validate({ value: 512 })).toBeUndefined();
        expect(validate({ value: -1 })).toBe('内存限制无效。');
    });

    it('accepts any entered number without a check', () => {
        expect(requiredNumber('必须提供端口。')({ value: 0 })).toBeUndefined();
    });
});

describe('submittedNumber', () => {
    it('returns an entered number, including zero', () => {
        expect(submittedNumber(0)).toBe(0);
        expect(submittedNumber(25565)).toBe(25565);
    });

    it('refuses an empty input', () => {
        expect(() => submittedNumber(null)).toThrow();
    });
});
