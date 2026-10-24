import { Button, ContentBox, Form, SpinnerOverlay } from '@/sdk';
import type { ViewProps } from '@/sdk/theme';
import { TextField } from '../shared/fields';

export default function EmailCard({ model, className }: ViewProps<'account.email'>) {
    return (
        <ContentBox className={className} title='更新电子邮箱地址'>
            <SpinnerOverlay size='large' visible={model.submitting} />
            <Form form={{ handleSubmit: model.submit }} className='m-0'>
                <TextField field={model.fields.email} id='current_email' label='电子邮箱' />
                <div className='mt-6'>
                    <TextField field={model.fields.password} id='confirm_password' label='确认密码' />
                </div>
                <div className='mt-6'>
                    <Button type='submit' disabled={!model.canSubmit} isLoading={model.submitting}>
                        更新电子邮箱
                    </Button>
                </div>
            </Form>
        </ContentBox>
    );
}
