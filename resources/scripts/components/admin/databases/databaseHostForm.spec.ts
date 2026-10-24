import { describe, expect, it } from 'vitest';
import type { AdminDatabaseHost } from '@/api/admin/database-hosts/queries';
import {
    databaseHostBodyFromFormValues,
    databaseHostFormValues,
    databaseHostValidators,
    newDatabaseHostFormValues,
} from './databaseHostForm';

const host: AdminDatabaseHost = {
    object: 'database_host',
    attributes: {
        id: 4,
        name: 'Primary MySQL',
        host: 'mysql.internal',
        port: 3307,
        username: 'pterodactyl',
        max_databases: null,
        databases_count: 2,
        node_id: 8,
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
    },
};

describe('database host form values', () => {
    it('starts a new host on the default MySQL port with no linked node', () => {
        expect(newDatabaseHostFormValues()).toEqual({
            name: '',
            host: '',
            port: 3306,
            username: '',
            password: '',
            nodeId: '',
            extensions: {},
        });
    });

    it('edits an existing host with a blank password', () => {
        expect(databaseHostFormValues(host)).toEqual({
            name: 'Primary MySQL',
            host: 'mysql.internal',
            port: 3307,
            username: 'pterodactyl',
            password: '',
            nodeId: '8',
            extensions: {},
        });
    });

    it('omits a blank password and unlinks an empty node from the request body', () => {
        expect(databaseHostBodyFromFormValues({ ...databaseHostFormValues(host), nodeId: '' })).toEqual({
            name: 'Primary MySQL',
            host: 'mysql.internal',
            port: 3307,
            username: 'pterodactyl',
            password: undefined,
            node_id: null,
            extensions: {},
        });
    });
});

describe('databaseHostValidators', () => {
    it('requires a port within range', () => {
        expect(databaseHostValidators.port.onChange({ value: null })).toBe('必须提供端口。');
        expect(databaseHostValidators.port.onChange({ value: 0 })).toBe('端口必须介于 1 与 65535 之间。');
        expect(databaseHostValidators.port.onChange({ value: 3306 })).toBeUndefined();
    });

    it('validates host names', () => {
        expect(databaseHostValidators.host.onChange({ value: '' })).toBe('必须提供主机。');
        expect(databaseHostValidators.host.onChange({ value: 'bad host' })).toBe('主机必须是有效的主机名或 IP 地址。');
        expect(databaseHostValidators.host.onChange({ value: '10.0.0.5' })).toBeUndefined();
    });

    it('requires a password only where the form asks for one', () => {
        expect(databaseHostValidators.requiredPassword.onChange({ value: '' })).toBe('必须提供密码。');
        expect(databaseHostValidators.requiredPassword.onChange({ value: 'secret' })).toBeUndefined();
    });
});
