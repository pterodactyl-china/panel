const INSTALLING_STATUSES: ReadonlySet<string> = new Set(['installing', 'install_failed', 'reinstall_failed']);

export const SKIPPED_INSTALL_SCRIPT_MESSAGE = '此服务器已配置为跳过其预设的安装脚本。在禁用该设置之前无法重新安装。';

export const isInstallingStatus = (status: string | null): boolean =>
    status !== null && INSTALLING_STATUSES.has(status);

export const canReinstallServer = (status: string | null, skipScripts: boolean): boolean =>
    !skipScripts || isInstallingStatus(status);
