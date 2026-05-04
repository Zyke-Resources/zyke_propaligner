import { useTranslation } from "../context/Translation";
import Button from "./utils/Button";
import ControlCameraIcon from "@mui/icons-material/ControlCamera";
import React, { useEffect, useRef, useState } from "react";
import { callback, listen, send } from "./utils/nui-events";
import { useModalContext } from "../context/ModalContext";
import History from "./history/History";
import { LoadingOverlay } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import PresetMenu from "./presets/PresetMenu";
import {
    AlignmentData,
    Bone,
    HistoryData,
    Preset,
    PropAlignmentData,
} from "../types";
import AnimationSection from "./inputs/AnimationSection";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import PropList from "./props/PropList";
import { useVisualizeData } from "../context/VisualizeData";
import CodeIcon from "@mui/icons-material/Code";
import Select from "./utils/Select";
import { useConfig } from "../context/ConfigContext";
import MapIcon from "@mui/icons-material/Map";
import { Animation } from "./MainMenu";

interface LocalProps {
    bones: Bone[];
    animations: Animation[];
}

const AlignmentInputs: React.FC<LocalProps> = ({ bones, animations }) => {
    const T = useTranslation();
    const config = useConfig();
    const { closeModal } = useModalContext();
    const { openVisualizeModal } = useVisualizeData();
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [editingData, setEditingData] = useState<AlignmentData>({
        dict: "",
        clip: "",
        props: [],
    });
    const [alignmentPosition, setAlignmentPosition] = useState<string>(
        config.Settings.alignmentPosition[0].name
    );

    const editingDataRef = useRef(editingData);

    const [loading, setLoading] = useState<boolean>(false);
    const [debouncedPropEditing] = useDebouncedValue(editingData.props, 500);
    const [hasInvalidModels, setHasInvalidModels] = useState(true);
    const [displayBackButton, setDisplayBackButton] = useState(false); // When using the script via another menu, to avoid confusion we display a new button to save & go back
    const [showStarterTooltip, setShowStarterTooltip] = useState(false);
    const isFirstRender = useRef(true);

    const handleForm = (e?: React.FormEvent<HTMLFormElement>): void => {
        if (submitting) return;

        setSubmitting(true);
        if (e) e.preventDefault();

        callback(
            "StartEditing",
            { editingData, alignmentPosition },
            undefined
        ).then(() => {
            setSubmitting(false);
        });
    };

    const loadHistory = (data: HistoryData) => {
        setLoading(true);
        closeModal("loadHistory");

        setTimeout(() => {
            setLoading(false);

            const { created, ...rest } = data;

            setEditingData({
                ...rest,
                props: rest.props.map((item) => ({
                    ...item,
                    tempId: Math.floor(Math.random() * 1000000),
                })),
            });
        }, 100);
    };

    const loadPreset = (data: Preset) => {
        setLoading(true);
        closeModal("presetMenu");

        send("OnPresetLoad", data.id);

        setTimeout(() => {
            setLoading(false);
            setEditingData({
                dict: data.data.dict,
                clip: data.data.clip,
                props: data.data.props.map((item) =>
                // item.tempId ? { ...item, tempId: Math.random() } : item
                ({
                    ...item,
                    tempId: Math.floor(Math.random() * 1000000),
                })
                ),
            });
        }, 100);
    };

    const getCurrentAlignmentData = () => {
        return editingData;
    };

    const validateAllProps = async (): Promise<boolean> => {
        if (editingData.props.length === 0) return true;

        for (let i = 0; i < editingData.props.length; i++) {
            const prop = editingData.props[i].prop;
            if (!prop || prop === "") return false;

            const isValid = await callback(
                "ValidatePropModel",
                editingData.props[i].prop
            );

            if (!isValid) return false;
        }

        return true;
    };

    const addbaseProp = async () => {
        if (!(await validateAllProps())) {
            send("Notify", "invalidModels");

            return;
        }

        const newProp: PropAlignmentData = {
            prop: "",
            bone: 0,
            offset: { x: 0.0, y: 0.0, z: 0.0 },
            rotation: { x: 0.0, y: 0.0, z: 0.0 },
            particles: [],
            tempId: Math.floor(Math.random() * 1000000),
        };

        setEditingData((prev) => ({
            ...prev,
            props: [...prev.props, newProp],
        }));

        setHasInvalidModels(true);
    };

    // On component mount, fetch stuff we need & do inits
    const setup = async () => {
        // Create a base prop & open it
        if (editingData.props.length === 0) {
            addbaseProp();
            setShowStarterTooltip(true);
        }
    };

    // Validate all prop models if nothing has been changed in a while
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        validateAllProps().then((val) => setHasInvalidModels(!val));
    }, [debouncedPropEditing]);

    listen(
        "SetAlignmentData",
        ({
            data,
            backButton,
        }: {
            data: AlignmentData;
            backButton: boolean | "prev";
        }) => {
            setEditingData((prev) => ({
                ...prev,
                dict: data.dict,
                clip: data.clip,
                props: (data.props.length > 0 ? data.props : prev.props).map(
                    (item) => ({
                        ...item,
                        tempId: Math.floor(Math.random() * 1000000),
                    })
                ),
            }));

            if (backButton !== "prev") {
                setDisplayBackButton(backButton);
            }
        }
    );

    useEffect(() => {
        editingDataRef.current = editingData;
    }, [editingData]);

    useEffect(() => {
        if (
            showStarterTooltip &&
            (editingData.props.length !== 1 ||
                editingData.props[0]?.prop.length > 0)
        ) {
            setShowStarterTooltip(false);
        }
    }, [editingData.props, showStarterTooltip]);

    useEffect(() => {
        send("AlignmentMenuMounted");
        setup();

        return () => {
            send("MenuUnmounted", {
                dict: editingDataRef.current.dict,
                clip: editingDataRef.current.clip,
                props: editingDataRef.current.props,
            });
        };
    }, []);

    return (
        <>
            <LoadingOverlay visible={loading} />
            <div>
                <div
                    style={{
                        width: "100%",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                        marginBottom: "0.5rem",
                    }}
                >
                    <History loadHistory={loadHistory} />
                    <PresetMenu
                        getCurrentAlignmentData={getCurrentAlignmentData}
                        loadPreset={loadPreset}
                    />
                </div>
            </div>
            <form onSubmit={handleForm}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: "1rem",
                    }}
                >
                    <Select
                        label={T("alignmentPosition")}
                        icon={<MapIcon />}
                        content={config.Settings.alignmentPosition.map(
                            (item: {
                                name: string;
                                label: string;
                                getPosition: () => {
                                    x: number;
                                    y: number;
                                    z: number;
                                };
                            }) => {
                                return {
                                    label: item.label,
                                    value: item.name,
                                };
                            }
                        )}
                        onChange={(value) => setAlignmentPosition(value)}
                        value={alignmentPosition}
                    />
                </div>

                <AnimationSection
                    editingData={editingData}
                    setEditingData={setEditingData}
                    animations={animations}
                />

                <PropList
                    editingData={editingData}
                    setEditingData={setEditingData}
                    bones={bones}
                    addbaseProp={addbaseProp}
                    hasInvalidModels={hasInvalidModels}
                    showStarterTooltip={showStarterTooltip}
                    onStarterTooltipDismiss={() => setShowStarterTooltip(false)}
                />

                <div
                    style={{
                        width: "15rem",
                        height: "1px",
                        background: "rgba(var(--grey4))",
                        margin: "1.25rem auto 0.75rem auto",
                    }}
                />

                <div
                    style={{
                        width: "100%",
                        display: "grid",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "1rem",
                        gridTemplateColumns: displayBackButton
                            ? "auto 2fr auto"
                            : "1fr auto",
                    }}
                >
                    {displayBackButton && (
                        <Button
                            wide
                            icon={<KeyboardReturnIcon />}
                            color="var(--grey4)"
                            onClick={() =>
                                send("CloseMenu", undefined, undefined)
                            }
                            buttonStyling={{
                                paddingLeft: "2rem !important",
                                paddingRight: "2rem !important",
                            }}
                        >
                            {T("backButton")}
                        </Button>
                    )}
                    <Button
                        wide
                        icon={<ControlCameraIcon />}
                        color="var(--blue2)"
                        onClick={() => handleForm()}
                        loading={submitting}
                    >
                        {T("startEditing")}
                    </Button>
                    <Button
                        wide
                        icon={<CodeIcon />}
                        color="var(--teal3)"
                        buttonStyling={{
                            paddingLeft: "2rem !important",
                            paddingRight: "2rem !important",
                        }}
                        onClick={() => {
                            const data = {
                                ...editingData,
                                props: editingData.props.map(
                                    ({ tempId, ...rest }) => rest
                                ),
                            };

                            openVisualizeModal(data);
                        }}
                    >
                        {T("visualizeData")}
                    </Button>
                </div>
            </form>
        </>
    );
};

export default AlignmentInputs;
