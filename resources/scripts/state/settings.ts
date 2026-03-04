import { action, Action } from 'easy-peasy';

export interface SiteSettings {
    name: string;
    locale: string;
    recaptcha: {
        enabled: boolean;
        siteKey: string;
    };
    logo: {
        title: string;
        favicon: string;
        auth: string;
    };
    icp: {
        enabled: boolean;
        record: string;
        security_record: string;
    };
    allocations: {
        consecutiveEnabled: boolean;
        consecutiveLimit: number;
    };
}

export interface SettingsStore {
    data?: SiteSettings;
    setSettings: Action<SettingsStore, SiteSettings>;
}

const settings: SettingsStore = {
    data: undefined,

    setSettings: action((state, payload) => {
        state.data = payload;
    }),
};

export default settings;
