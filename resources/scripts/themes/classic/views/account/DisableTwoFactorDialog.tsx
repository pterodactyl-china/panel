import { Button, Dialog, Input, Tooltip, type AccountTwoFactorModel } from '@/sdk';

export default function DisableTwoFactorDialog({ model }: { model: AccountTwoFactorModel }) {
    const { disable } = model;
    const { password } = disable.fields;

    return (
        <Dialog
            open={model.dialog === 'disable'}
            onClose={model.closeDialog}
            preventExternalClose={disable.submitting}
            hideCloseIcon={disable.submitting}
            title='禁用两步验证'
            description='禁用两步验证会降低账户的安全性。'
        >
            <form
                id='disable-totp-form'
                className='mt-6'
                onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    disable.submit();
                }}
            >
                <label className='block pb-1' htmlFor='totp-password'>
                    密码
                </label>
                <Input {...password.fieldProps} id='totp-password' />
                <Dialog.Footer>
                    <Button.Text onClick={model.closeDialog}>取消</Button.Text>
                    <Tooltip
                        delay={100}
                        disabled={password.fieldProps.value.length > 0}
                        content='必须输入账户密码才能继续。'
                    >
                        <Button.Danger
                            type='submit'
                            form='disable-totp-form'
                            disabled={!disable.canSubmit}
                            isLoading={disable.submitting}
                        >
                            禁用
                        </Button.Danger>
                    </Tooltip>
                </Dialog.Footer>
            </form>
        </Dialog>
    );
}
