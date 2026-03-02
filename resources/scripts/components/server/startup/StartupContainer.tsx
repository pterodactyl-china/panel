import React, { useCallback, useEffect, useState } from 'react';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import tw from 'twin.macro';
import VariableBox from '@/components/server/startup/VariableBox';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import getServerStartup from '@/api/swr/getServerStartup';
import Spinner from '@/components/elements/Spinner';
import { ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { ServerContext } from '@/state/server';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import Select from '@/components/elements/Select';
import isEqual from 'react-fast-compare';
import Input from '@/components/elements/Input';
import setSelectedDockerImage from '@/api/server/setSelectedDockerImage';
import InputSpinner from '@/components/elements/InputSpinner';
import useFlash from '@/plugins/useFlash';
import updateStartupEgg from '@/api/server/updateStartupEgg';
import { usePermissions } from '@/plugins/usePermissions';
import FlashMessageRender from '@/components/FlashMessageRender';

const StartupContainer = () => {
    const [loading, setLoading] = useState(false);
    const [eggLoading, setEggLoading] = useState(false);
    const [selectedNestId, setSelectedNestId] = useState<number | undefined>(undefined);
    const { clearFlashes, clearAndAddHttpError } = useFlash();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const variables = ServerContext.useStoreState(
        ({ server }) => ({
            variables: server.data!.variables,
            invocation: server.data!.invocation,
            dockerImage: server.data!.dockerImage,
        }),
        isEqual
    );

    const { data, error, isValidating, mutate } = getServerStartup(uuid, {
        ...variables,
        dockerImages: { [variables.dockerImage]: variables.dockerImage },
    });

    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    const isCustomImage =
        data &&
        !Object.values(data.dockerImages)
            .map((v) => v.toLowerCase())
            .includes(variables.dockerImage.toLowerCase());

    const [canChangeEgg] = usePermissions(['startup.egg-change']);

    // Sync selectedNestId with data.currentNestId on first load only (when selectedNestId is undefined)
    useEffect(() => {
        if (data?.currentNestId !== undefined && selectedNestId === undefined) {
            setSelectedNestId(data.currentNestId);
        }
    }, [data?.currentNestId, selectedNestId]);

    useEffect(() => {
        // Since we're passing in initial data this will not trigger on mount automatically. We
        // want to always fetch fresh information from the API however when we're loading the startup
        // information.
        mutate();
    }, []);

    useDeepCompareEffect(() => {
        if (!data) return;

        setServerFromState((s) => ({
            ...s,
            invocation: data.invocation,
            variables: data.variables,
        }));
    }, [data]);

    const updateSelectedDockerImage = useCallback(
        (v: React.ChangeEvent<HTMLSelectElement>) => {
            setLoading(true);
            clearFlashes('startup:image');

            const image = v.currentTarget.value;
            setSelectedDockerImage(uuid, image)
                .then(() => setServerFromState((s) => ({ ...s, dockerImage: image })))
                .catch((error) => {
                    console.error(error);
                    clearAndAddHttpError({ key: 'startup:image', error });
                })
                .then(() => setLoading(false));
        },
        [uuid]
    );

    const handleEggChange = useCallback(
        (eggId: number) => {
            setEggLoading(true);
            clearFlashes('startup:egg');

            updateStartupEgg(uuid, eggId)
                .then((response) => {
                    // Pick first docker image from the new egg as the current image
                    const firstDockerImage = Object.values(response.dockerImages)[0] || variables.dockerImage;

                    setSelectedNestId(response.currentNestId);
                    mutate(
                        () => ({
                            invocation: response.invocation,
                            variables: response.variables,
                            dockerImages: response.dockerImages,
                            eggChangeMode: response.eggChangeMode,
                            nests: response.nests,
                            currentEggId: response.currentEggId,
                            currentNestId: response.currentNestId,
                        }),
                        false
                    );
                    // Fix: also update dockerImage so the Docker image section reflects the new egg
                    setServerFromState((s) => ({
                        ...s,
                        invocation: response.invocation,
                        variables: response.variables,
                        dockerImage: firstDockerImage,
                    }));
                })
                .catch((error) => {
                    console.error(error);
                    clearAndAddHttpError({ key: 'startup:egg', error });
                })
                .then(() => setEggLoading(false));
        },
        [uuid]
    );

    // Handle nest group change:
    // - In all modes that show the nest dropdown, switching nest auto-applies the first egg.
    const handleNestChange = useCallback(
        (nestId: number) => {
            setSelectedNestId(nestId);
            const nest = data?.nests?.find((n) => n.id === nestId);
            if (nest && nest.eggs.length > 0) {
                handleEggChange(nest.eggs[0].id);
            }
        },
        [data, handleEggChange]
    );

    const eggChangeMode = data?.eggChangeMode;
    const showNestDropdown = eggChangeMode === 'both';
    const showEggDropdown = eggChangeMode === 'egg_only' || eggChangeMode === 'both';
    const showEggChangeSection = canChangeEgg && eggChangeMode && data?.nests;

    const currentNest = data?.nests?.find((n) => n.id === selectedNestId);

    return !data ? (
        !error || (error && isValidating) ? (
            <Spinner centered size={Spinner.Size.LARGE} />
        ) : (
            <ServerError title={'卧槽!'} message={httpErrorToHuman(error)} onRetry={() => mutate()} />
        )
    ) : (
        <ServerContentBlock title={'启动设置'} showFlashKey={'startup:image'}>
            <FlashMessageRender byKey={'startup:egg'} css={tw`mb-4`} />
            <div css={tw`md:flex`}>
                <TitledGreyBox title={'启动命令'} css={tw`flex-1`}>
                    <div css={tw`px-1 py-2`}>
                        <p css={tw`font-mono bg-neutral-900 rounded py-2 px-4`}>{data.invocation}</p>
                    </div>
                </TitledGreyBox>
                <TitledGreyBox title={'Docker 镜像'} css={tw`flex-1 lg:flex-none lg:w-1/3 mt-8 md:mt-0 md:ml-10`}>
                    {Object.keys(data.dockerImages).length > 1 && !isCustomImage ? (
                        <>
                            <InputSpinner visible={loading}>
                                <Select
                                    disabled={Object.keys(data.dockerImages).length < 2}
                                    onChange={updateSelectedDockerImage}
                                    value={variables.dockerImage}
                                >
                                    {Object.keys(data.dockerImages).map((key) => (
                                        <option key={data.dockerImages[key]} value={data.dockerImages[key]}>
                                            {key}
                                        </option>
                                    ))}
                                </Select>
                            </InputSpinner>
                            <p css={tw`text-xs text-neutral-300 mt-2`}>
                                这是一项高级设置，其允许您选择在运行此服务器时使用的 Docker 映像。
                            </p>
                        </>
                    ) : (
                        <>
                            <Input disabled readOnly value={variables.dockerImage} />
                            {isCustomImage && (
                                <p css={tw`text-xs text-neutral-300 mt-2`}>
                                    这个服务器的 Docker 镜像已由管理员手动设置，无法通过此界面更改。
                                </p>
                            )}
                        </>
                    )}
                </TitledGreyBox>
            </div>
            {showEggChangeSection && (
                <div css={tw`mt-8`}>
                    <TitledGreyBox title={'切换预设'}>
                        <InputSpinner visible={eggLoading}>
                            <div css={tw`md:flex md:gap-4`}>
                                {showNestDropdown && (
                                    <div css={tw`flex-1`}>
                                        <label css={tw`block text-xs text-neutral-300 mb-1`}>预设组</label>
                                        <Select
                                            value={selectedNestId}
                                            onChange={(e) => handleNestChange(parseInt(e.currentTarget.value))}
                                        >
                                            {data.nests!.map((nest) => (
                                                <option key={nest.id} value={nest.id}>
                                                    {nest.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                )}
                                {showEggDropdown && (
                                    <div css={[tw`flex-1`, showNestDropdown && tw`mt-4 md:mt-0`]}>
                                        <label css={tw`block text-xs text-neutral-300 mb-1`}>预设</label>
                                        <Select
                                            value={data.currentEggId}
                                            onChange={(e) => handleEggChange(parseInt(e.currentTarget.value))}
                                        >
                                            {(
                                                currentNest || data.nests!.find((n) => n.id === data.currentNestId)
                                            )?.eggs.map((egg) => (
                                                <option key={egg.id} value={egg.id}>
                                                    {egg.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </InputSpinner>
                        <p css={tw`text-xs text-neutral-300 mt-2`}>
                            切换预设后服务器将使用新预设的启动命令，您可能需要重新安装服务器以应用更改。
                        </p>
                    </TitledGreyBox>
                </div>
            )}
            <h3 css={tw`mt-8 mb-2 text-2xl`}>变量</h3>
            <div css={tw`grid gap-8 md:grid-cols-2`}>
                {data.variables.map((variable) => (
                    <VariableBox key={variable.envVariable} variable={variable} />
                ))}
            </div>
        </ServerContentBlock>
    );
};

export default StartupContainer;
