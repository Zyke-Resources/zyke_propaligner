import React, { useEffect, useRef, useState } from "react";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import CropRotateIcon from "@mui/icons-material/CropRotate";
import { useTranslation } from "../../context/Translation";
import NumberInput from "../utils/NumberInput";
import {
    AlignmentData,
    Bone,
    ParticleAlignmentData,
} from "../../types";
import TextInput from "../utils/TextInput";
import { FaBox } from "react-icons/fa6";
import { useDebouncedValue } from "@mantine/hooks";
import { callback } from "../utils/nui-events";
import { PiBoneFill } from "react-icons/pi";
import TagIcon from "@mui/icons-material/Tag";
import Button from "../utils/Button";
import { LuCrown } from "react-icons/lu";
import DeleteIcon from "@mui/icons-material/Delete";
import Wait from "../utils/Wait";
import Select from "../utils/Select";
import Modal from "../utils/Modal";
import { useModalContext } from "../../context/ModalContext";
import DottedBackground from "../utils/DottedBackground";
import CornerStyling from "../utils/CornerStyling";
import SectionTitle from "../utils/SectionTitle";
import ParticleSection from "../particle_section/ParticleSection";

interface PropAlignmentsProps {
    idx: number;
    prop: string;
    bone: number;
    offset: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    setEditingData: React.Dispatch<React.SetStateAction<AlignmentData>>;
    totalProps: number;
    bones: Bone[];
    tempId: number;
    particles: ParticleAlignmentData[] | null;
    showStarterTooltip?: boolean;
    onStarterTooltipDismiss?: () => void;
}

const PropAlignments: React.FC<PropAlignmentsProps> = ({
    idx,
    prop,
    bone,
    offset,
    rotation,
    setEditingData,
    totalProps,
    bones,
    tempId,
    particles,
    showStarterTooltip,
    onStarterTooltipDismiss,
}) => {
    const T = useTranslation();
    const [propModelChange] = useDebouncedValue(prop, 500);
    const [modelValid, setModelValid] = useState<boolean>(true);
    const [hovering, setHovering] = useState<boolean>(false);
    const [hasStarterTooltipHoverEnded, setHasStarterTooltipHoverEnded] =
        useState<boolean>(false);
    const firstRender = useRef(true);

    const { openModal, closeModal } = useModalContext();
    const modalId = "prop-" + tempId;

    const setValue = (
        path: "rotation" | "offset",
        key: "x" | "y" | "z",
        val: number | string
    ) => {
        setEditingData((prev) => ({
            ...prev,
            props: prev.props.map((item, i) =>
                i === idx
                    ? {
                          ...item,
                          [path]: {
                              ...item[path],
                              [key]: val,
                          },
                      }
                    : item
            ),
        }));
    };

    useEffect(() => {
        // Avoid instant error, allow modifying first
        if (firstRender.current === true) {
            firstRender.current = false;
            return;
        }

        if (!propModelChange) return setModelValid(false);
        if (propModelChange.length === 0) return setModelValid(false);

        callback("ValidatePropModel", propModelChange).then((res) =>
            setModelValid(res)
        );
    }, [propModelChange]);

    useEffect(() => {
        if (!showStarterTooltip) {
            setHasStarterTooltipHoverEnded(false);
        }
    }, [showStarterTooltip]);

    const makePrimary = () => {
        if (idx === 0) return;

        setEditingData((prev) => {
            const nProps = [...prev.props];
            const [movedItem] = nProps.splice(idx, 1);
            nProps.unshift(movedItem);

            return { ...prev, props: nProps };
        });
    };

    const deleteProp = async () => {
        if (totalProps <= 1) return;

        closeModal(modalId);
        await Wait(200);

        setEditingData((prev) => ({
            ...prev,
            props: prev.props.filter((_, itemIdx) => itemIdx !== idx),
        }));
    };

    return (
        <>
            <Button
                onClick={() => {
                    onStarterTooltipDismiss?.();
                    openModal(modalId);
                }}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => {
                    setHovering(false);

                    if (showStarterTooltip) {
                        setHasStarterTooltipHoverEnded(true);
                    }
                }}
                tooltipLabel={showStarterTooltip ? "Click to edit" : undefined}
                tooltipOpened={
                    showStarterTooltip && !hasStarterTooltipHoverEnded
                        ? true
                        : undefined
                }
                tooltipWithArrow
                tooltipPosition="bottom"
                buttonStyling={{
                    width: "100%",
                }}
                removeDefaultComponent
            >
                <CornerStyling color="rgba(var(--blue2))" hovered={hovering} />
                <DottedBackground />

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "start",
                        flexDirection: "row",
                        height: "2.5rem",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "start",
                            flexDirection: "row",
                            marginRight: "0.5rem",
                        }}
                    >
                        <TagIcon
                            style={{
                                color: "rgba(var(--secIcon))",
                                fontSize: "1.4rem",
                                marginBottom: "-0.1rem",
                            }}
                        />
                        <p
                            style={{
                                color: "rgba(var(--secText))",
                                fontSize: "1.5rem",
                                fontWeight: "600",
                            }}
                        >
                            {idx + 1}
                        </p>
                    </div>
                    <p>{prop.length > 0 ? prop : T("missingProp")}</p>
                </div>
            </Button>
            <Modal
                id={modalId}
                title={prop.length > 0 ? prop : T("missingProp")}
                icon={<FaBox />}
                closeButton
                modalStyling={{
                    width: "65rem",
                }}
            >
                {/* Prop */}
                <SectionTitle
                    text={T("propAlignmentSectionTitle")}
                    ignoreSpacing
                />

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                    }}
                >
                    <TextInput
                        icon={<FaBox />}
                        label={T("propLabel")}
                        value={prop}
                        error={
                            !modelValid ? T("invalidModelWarning") : undefined
                        }
                        onChange={(e) =>
                            setEditingData((prev) => ({
                                ...prev,
                                props: prev.props.map((item, i) =>
                                    i === idx
                                        ? {
                                              ...item,
                                              prop: e.target.value,
                                          }
                                        : item
                                ),
                            }))
                        }
                    />
                    <Select
                        label={T("propBone")}
                        icon={<PiBoneFill />}
                        value={(bone || 0).toString()}
                        searchable
                        content={bones}
                        onChange={(e) => {
                            setEditingData((prev) => ({
                                ...prev,
                                props: prev.props.map((item, i) =>
                                    i === idx
                                        ? {
                                              ...item,
                                              bone: Number(e),
                                          }
                                        : item
                                ),
                            }));
                        }}
                    />
                </div>

                {/* Offset */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "1rem",
                    }}
                >
                    <NumberInput
                        icon={<ZoomOutMapIcon />}
                        label={T("propOffsetX")}
                        value={offset.x}
                        precision={3}
                        hideControls
                        onChange={(e) => setValue("offset", "x", e)}
                    />
                    <NumberInput
                        icon={<ZoomOutMapIcon />}
                        label={T("propOffsetY")}
                        value={offset.y}
                        precision={3}
                        hideControls
                        onChange={(e) => setValue("offset", "y", e)}
                    />
                    <NumberInput
                        icon={<ZoomOutMapIcon />}
                        label={T("propOffsetZ")}
                        value={offset.z}
                        precision={3}
                        hideControls
                        onChange={(e) => setValue("offset", "z", e)}
                    />
                </div>

                {/* Rotation */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "1rem",
                    }}
                >
                    <NumberInput
                        icon={<CropRotateIcon />}
                        label={T("propRotationX")}
                        value={rotation.x}
                        precision={3}
                        hideControls
                        onChange={(e) => setValue("rotation", "x", e)}
                    />
                    <NumberInput
                        icon={<CropRotateIcon />}
                        label={T("propRotationY")}
                        value={rotation.y}
                        precision={3}
                        hideControls
                        onChange={(e) => setValue("rotation", "y", e)}
                    />
                    <NumberInput
                        icon={<CropRotateIcon />}
                        label={T("propRotationZ")}
                        value={rotation.z}
                        precision={3}
                        hideControls
                        onChange={(e) => setValue("rotation", "z", e)}
                    />
                </div>

                <ParticleSection
                    particles={particles}
                    setEditingData={setEditingData}
                    propIdx={idx}
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
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "end",
                        marginTop: "0.25rem",
                    }}
                >
                    <Button
                        icon={<LuCrown />}
                        color="rgba(var(--blue2))"
                        onClick={makePrimary}
                        disabled={idx === 0}
                        hollow={idx === 0}
                        buttonStyling={{
                            marginRight: "0.75rem",
                        }}
                    >
                        {T("makePrimary")}
                    </Button>
                    <Button
                        icon={<DeleteIcon />}
                        color="rgba(var(--red3))"
                        disabled={totalProps <= 1}
                        hollow={totalProps <= 1}
                        onClick={async () => deleteProp()}
                    >
                        {T("deleteProp")}
                    </Button>
                </div>
            </Modal>
        </>
    );
};

export default PropAlignments;
