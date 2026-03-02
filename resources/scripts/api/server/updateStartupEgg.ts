import http, { FractalResponseList } from '@/api/http';
import { rawDataToServerEggVariable } from '@/api/transformers';
import { ServerEggVariable } from '@/api/server/types';
import { EggChangeMode, NestData } from '@/api/swr/getServerStartup';

export interface EggChangeResponse {
    variables: ServerEggVariable[];
    invocation: string;
    dockerImages: Record<string, string>;
    eggChangeMode: EggChangeMode;
    nests: NestData[];
    currentEggId: number;
    currentNestId: number;
}

export default async (uuid: string, eggId: number): Promise<EggChangeResponse> => {
    const { data } = await http.put(`/api/client/servers/${uuid}/startup/egg`, { egg_id: eggId });

    const variables = ((data as FractalResponseList).data || []).map(rawDataToServerEggVariable);

    return {
        variables,
        invocation: data.meta.startup_command,
        dockerImages: data.meta.docker_images || {},
        // The backend always returns a non-disabled mode here since it would have rejected the request otherwise
        eggChangeMode: data.meta.egg_change_mode as EggChangeMode,
        nests: data.meta.nests || [],
        currentEggId: data.meta.current_egg_id,
        currentNestId: data.meta.current_nest_id,
    };
};
