import React from 'react';
import Can from '@/components/elements/Can';
import { AccessDenied } from '@/components/elements/ScreenBlock';

interface Props {
    permission: string | string[] | null;
    children?: React.ReactNode;
}

const accessDenied = <AccessDenied message='您没有访问此页面的权限。' />;

export default function PermissionRoute({ permission, children }: Props) {
    if (!permission) {
        return children;
    }

    return (
        <Can matchAny action={permission} renderOnError={accessDenied}>
            {children}
        </Can>
    );
}
