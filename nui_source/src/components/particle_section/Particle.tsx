import { Accordion } from "@mantine/core";
import React from "react";
import { AlignmentData, ParticleAlignmentData } from "../../types";
import { useTranslation } from "../../context/Translation";
import Button from "../utils/Button";
import DeleteIcon from "@mui/icons-material/Delete";
import Wait from "../utils/Wait";
import NumberInput from "../utils/NumberInput";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import FlareIcon from "@mui/icons-material/Flare";
import DebouncedTextInput from "../utils/DebouncedTextInput";
import TagIcon from "@mui/icons-material/Tag";
import Tooltip from "../utils/Tooltip";
import { useFieldRestriction } from "../../context/FieldRestrictions";

interface ParticleProps {
    idx: number;
    particle: ParticleAlignmentData;
    setEditingData: React.Dispatch<React.SetStateAction<AlignmentData>>;
    propIdx: number;
    accOpen: string | null;
    setAccOpen: React.Dispatch<React.SetStateAction<string | null>>;
}

const Particle: React.FC<ParticleProps> = ({
    idx,
    particle,
    setEditingData,
    propIdx,
    accOpen,
    setAccOpen,
}) => {
    const T = useTranslation();
    const accValue = `particle-${idx}`;
    const sizeRestriction = useFieldRestriction("particles.size");

    const deleteParticle = async () => {
        if (accOpen === accValue) {
            setAccOpen(null);
            await Wait(200);
        }

        setEditingData((prev) => {
            const updatedProps = prev.props.map((prop, idx) => {
                if (idx === propIdx) {
                    const updatedParticles = prop.particles
                        ? prop.particles.filter((_, index) => index !== idx)
                        : null;

                    return { ...prop, particles: updatedParticles };
                }
                return prop;
            });

            return { ...prev, props: updatedProps };
        });
    };

    const setParticleData = (data: any) => {
        setEditingData((prev) => {
            const newProps = [...prev.props];
            const newParticles = [...(newProps[propIdx].particles || [])];

            newParticles[idx] = {
                ...newParticles[idx],
                ...data,
            };

            return {
                ...prev,
                props: [
                    ...newProps.slice(0, propIdx),
                    {
                        ...newProps[propIdx],
                        particles: newParticles,
                    },
                ],
            };
        });
    };

    return (
        <Accordion.Item value={`particle-${idx}`}>
            <Accordion.Control
                style={{
                    height: "3.5rem",
                }}
            >
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
                    <p>{T("particle")}</p>
                </div>
            </Accordion.Control>
            <Accordion.Panel>
                {/* Dict, clip & size */}
                <div
                    style={{
                        width: "100%",
                        background: "rgba(var(--orange2), 0.3)",
                        padding: "0.5rem",
                        borderRadius: "var(--lborderRadius)",
                        marginBottom: "0.5rem",
                        boxSizing: "border-box",
                    }}
                >
                    <p
                        style={{
                            fontSize: "1.4rem",
                            color: "rgba(var(--orange2))",
                            fontWeight: "bold",
                            textAlign: "center",
                        }}
                    >
                        {T("invalidParticleWarning")}
                    </p>
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "1rem",
                    }}
                >
                    <DebouncedTextInput
                        icon={<FlareIcon />}
                        label={T("particleDict")}
                        value={particle.dict}
                        onChange={(value) =>
                            setParticleData({
                                dict: value,
                            })
                        }
                    />
                    <DebouncedTextInput
                        icon={<FlareIcon />}
                        label={T("particleClip")}
                        value={particle.clip}
                        onChange={(value) =>
                            setParticleData({
                                clip: value,
                            })
                        }
                    />
                    <Tooltip
                        label={sizeRestriction.tooltip}
                        disabled={!sizeRestriction.disabled}
                    >
                        <div>
                            <NumberInput
                                icon={<ZoomOutMapIcon />}
                                label={T("particleSize")}
                                value={particle.size}
                                precision={3}
                                hideControls
                                disabled={sizeRestriction.disabled}
                                onChange={(e) =>
                                    setParticleData({
                                        size: e,
                                    })
                                }
                            />
                        </div>
                    </Tooltip>
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
                        value={particle.offset.x}
                        precision={3}
                        hideControls
                        onChange={(e) =>
                            setParticleData({
                                offset: { ...particle.offset, x: e },
                            })
                        }
                    />
                    <NumberInput
                        icon={<ZoomOutMapIcon />}
                        label={T("propOffsetY")}
                        value={particle.offset.y}
                        precision={3}
                        hideControls
                        onChange={(e) =>
                            setParticleData({
                                offset: { ...particle.offset, y: e },
                            })
                        }
                    />
                    <NumberInput
                        icon={<ZoomOutMapIcon />}
                        label={T("propOffsetZ")}
                        value={particle.offset.z}
                        precision={3}
                        hideControls
                        onChange={(e) =>
                            setParticleData({
                                offset: { ...particle.offset, z: e },
                            })
                        }
                    />
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "end",
                        marginTop: "0.25rem",
                    }}
                >
                    <Button
                        icon={<DeleteIcon />}
                        color="rgba(var(--red3))"
                        onClick={async () => deleteParticle()}
                    >
                        {T("deleteParticle")}
                    </Button>
                </div>
            </Accordion.Panel>
        </Accordion.Item>
    );
};

export default Particle;
