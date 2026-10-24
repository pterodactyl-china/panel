import type { AdminServer } from '@/api/admin/servers/queries';
import { EditAction, EditLinkAction } from '@/components/elements/table/RowActions';

/** Links to the server's editable Details tab, which only exists once the server is installed. */
export default function ServerEditAction({ server }: { server: AdminServer }) {
    const { id, name, container } = server.attributes;
    const label = `编辑 ${name}`;

    if (container.installed !== 1) {
        return <EditAction aria-label={label} disabled disabledReason='服务器安装完成前无法编辑。' />;
    }

    return <EditLinkAction aria-label={label} to='/panel/servers/$id/details' params={{ id }} />;
}
