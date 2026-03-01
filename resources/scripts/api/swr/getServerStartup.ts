import useSWR, { ConfigInterface } from 'swr';
import http, { FractalResponseList } from '@/api/http';
import { rawDataToServerEggVariable } from '@/api/transformers';
import { ServerEggVariable } from '@/api/server/types';

export interface NestData {
    id: number;
    name: string;
    eggs: Array<{ id: number; name: string }>;
}

interface Response {
    invocation: string;
    variables: ServerEggVariable[];
    dockerImages: Record<string, string>;
    eggChangeAllowed?: boolean;
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
                eggChangeAllowed: data.meta.egg_change_allowed || false,
                nests: data.meta.nests || undefined,
                currentEggId: data.meta.current_egg_id || undefined,
                currentNestId: data.meta.current_nest_id || undefined,
            };
        },
        { initialData: initialData || undefined, errorRetryCount: 3, ...(config || {}) }
    );
