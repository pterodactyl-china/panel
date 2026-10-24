import { Button, ContentBox, Form, SpinnerOverlay } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';
import { TextField } from '../shared/fields';

export default function PasswordCard({ model, className }: ViewProps<'account.password'>) {
    const { fields } = model;

    return (
        <ContentBox className={className} title='更新密码'>
            <SpinnerOverlay size='large' visible={model.submitting} />
            <Form form={{ handleSubmit: model.submit }} className='m-0'>
                <TextField field={fields.current} id='current_password' label='当前密码' />
                <div className='mt-6'>
                    <TextField
                        field={fields.password}
                        id='new_password'
                        label='新密码'
                        description='新密码长度至少为 8 个字符，且不应与其他网站重复。'
                    />
                </div>
                <div className='mt-6'>
                    <TextField field={fields.confirmPassword} id='confirm_new_password' label='确认新密码' />
                </div>
                <div className='mt-6'>
                    <Button type='submit' disabled={!model.canSubmit} isLoading={model.submitting}>
                        更新密码
                    </Button>
                </div>
            </Form>
        </ContentBox>
    );
}
