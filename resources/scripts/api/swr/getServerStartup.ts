import useSWR, { ConfigInterface } from 'swr';
import http, { FractalResponseList } from '@/api/http';
import { rawDataToServerEggVariable } from '@/api/transformers';
import { ServerEggVariable } from '@/api/server/types';

// 'disabled' is intentionally excluded: undefined represents the disabled state in the frontend.
export type EggChangeMode = 'egg_only' | 'both';

const VALID_EGG_CHANGE_MODES: readonly string[] = ['egg_only', 'both'];

function toEggChangeMode(value: unknown): EggChangeMode | undefined {
    if (typeof value === 'string' && VALID_EGG_CHANGE_MODES.includes(value)) {
        return value as EggChangeMode;
    }
    return undefined;
}

export interface NestData {
    id: number;
    name: string;
    eggs: Array<{ id: number; name: string }>;
}

interface Response {
    invocation: string;
    variables: ServerEggVariable[];
    dockerImages: Record<string, string>;
    eggChangeMode?: EggChangeMode;
    nests?: NestData[];
    currentEggId?: number;
    currentNestId?: number;
}

export default (uuid: string, initialData?: Response | null, config?: ConfigInterface<Response>) =>
    useSWR(
        [uuid, '/startup'],
        async (): Promise<Response> => {
            const { data } = await http.get(`/api/client/servers/${uuid}/startup`);

            const variables = ((data as FractalResponseList).data || []).map(rawDataToServerEggVariable);

            return {
                variables,
                invocation: data.meta.startup_command,
                dockerImages: data.meta.docker_images || {},
                eggChangeMode: toEggChangeMode(data.meta.egg_change_mode),
                nests: data.meta.nests || undefined,
                currentEggId: data.meta.current_egg_id || undefined,
                currentNestId: data.meta.current_nest_id || undefined,
            };
        },
        { initialData: initialData || undefined, errorRetryCount: 3, ...(config || {}) }
    );
