/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { PasswordInput } from '@/components/form/PasswordInput';

afterEach(cleanup);

function Harness({ onGenerate }: { onGenerate: (value: string) => void }) {
    const [value, setValue] = useState('');

    return <PasswordInput aria-label='Password' value={value} onValueChange={setValue} onGenerate={onGenerate} />;
}

it('fills, reveals and offers to copy a generated password', () => {
    const onGenerate = vi.fn();

    render(<Harness onGenerate={onGenerate} />);

    const input = screen.getByLabelText<HTMLInputElement>('Password');

    expect(input.type).toBe('password');
    expect(screen.queryByLabelText('复制密码')).toBeNull();

    fireEvent.click(screen.getByLabelText('生成安全密码'));

    expect(input.value).toHaveLength(17);
    expect(input.type).toBe('text');
    expect(onGenerate).toHaveBeenCalledWith(input.value);
    expect(screen.getByLabelText('复制密码')).not.toBeNull();

    fireEvent.change(input, { target: { value: 'typed' } });

    expect(input.value).toBe('typed');
    expect(screen.queryByLabelText('复制密码')).toBeNull();
});
