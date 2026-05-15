import React, { createContext, useContext, ReactNode, useMemo, useState } from "react";
import Modal from "../components/utils/Modal";
import { useModalContext } from "./ModalContext";
import Button from "../components/utils/Button";
import DropDown, { DropDownItemData } from "../components/utils/DropDown";
import { Box } from "@mantine/core";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import IconButton from "../components/utils/IconButton";
import CheckIcon from "@mui/icons-material/Check";
import { IoIosCopy } from "react-icons/io";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import CodeIcon from "@mui/icons-material/Code";
import { useTranslation } from "./Translation";
import SourceIcon from "@mui/icons-material/Source";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import { Euler, MathUtils } from "three";

type OptionWithCodeStr = DropDownItemData & {
    codeStr: () => string;
};

type DataFormat = "lua" | "luaVectors" | "json";
type RotationOrder = 0 | 1 | 2 | 3 | 4 | 5;

type RotationOrderOption = DropDownItemData & {
    value: RotationOrder;
};

type RotationOrderName = "XYZ" | "XZY" | "YXZ" | "YZX" | "ZXY" | "ZYX";
type Vector3Value = {
    x: number;
    y: number;
    z: number;
};

const BASE_ROTATION_ORDER: RotationOrder = 1;

// GTA/FiveM applies these native orders opposite of Three.js' Euler labels.
const THREE_ROTATION_ORDER_NAMES: Record<RotationOrder, RotationOrderName> = {
    0: "ZYX",
    1: "YZX",
    2: "ZXY",
    3: "XZY",
    4: "YXZ",
    5: "XYZ",
};

const ROTATION_ORDER_OPTIONS: RotationOrderOption[] = [
    {
        label: "Order 0 - XYZ",
        name: "0",
        value: 0,
        descriptionItems: ["ox_inventory", "ox_lib progress props"],
    },
    {
        label: "Order 1 - XZY (Base)",
        name: "1",
        value: 1,
        descriptionItems: ["zyke_smoking", "zyke_consumables", "zyke_propaligner"],
    },
    {
        label: "Order 2 - YXZ",
        name: "2",
        value: 2,
    },
    {
        label: "Order 3 - YZX",
        name: "3",
        value: 3,
    },
    {
        label: "Order 4 - ZXY",
        name: "4",
        value: 4,
    },
    {
        label: "Order 5 - ZYX",
        name: "5",
        value: 5,
    },
];

const isVector3 = (value: unknown): value is Vector3Value => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;

    const vector = value as Partial<Vector3Value>;
    const keys = Object.keys(value);
    return (
        keys.length === 3 &&
        keys.includes("x") &&
        keys.includes("y") &&
        keys.includes("z") &&
        typeof vector.x === "number" &&
        typeof vector.y === "number" &&
        typeof vector.z === "number"
    );
};

function roundRotationValue(value: number) {
    const rounded = Math.round(value * 1000000) / 1000000;
    return Object.is(rounded, -0) ? 0 : rounded;
}

function reorderRotation(value: Vector3Value, targetOrder: RotationOrder) {
    if (targetOrder === BASE_ROTATION_ORDER) return value;

    const rotation = new Euler(
        MathUtils.degToRad(value.x),
        MathUtils.degToRad(value.y),
        MathUtils.degToRad(value.z),
        THREE_ROTATION_ORDER_NAMES[BASE_ROTATION_ORDER]
    );

    rotation.reorder(THREE_ROTATION_ORDER_NAMES[targetOrder]);

    return {
        x: roundRotationValue(MathUtils.radToDeg(rotation.x)),
        y: roundRotationValue(MathUtils.radToDeg(rotation.y)),
        z: roundRotationValue(MathUtils.radToDeg(rotation.z)),
    };
}

function withRotationOrderValues(
    obj: unknown,
    targetOrder: RotationOrder,
    key?: string
): unknown {
    if (key === "rotation" && isVector3(obj)) {
        return reorderRotation(obj, targetOrder);
    }

    if (Array.isArray(obj)) {
        return obj.map((value) => withRotationOrderValues(value, targetOrder));
    }

    if (!obj || typeof obj !== "object") return obj;

    return Object.fromEntries(
        Object.entries(obj as Record<string, unknown>)
            .filter(([entryKey]) => entryKey !== "restrictedFields")
            .map(([entryKey, value]) => [
                entryKey,
                withRotationOrderValues(value, targetOrder, entryKey),
            ])
    );
}

// Utility to convert JS object to indented Lua string
function toLua(obj: any, indent = 0, useVectors = false): string {
    const pad = (n: number) => "    ".repeat(n);

    if (obj === null) return "nil";
    if (typeof obj === "string") return `"${obj.replace(/"/g, '"')}"`;
    if (typeof obj === "number" || typeof obj === "boolean")
        return obj.toString();
    if (useVectors && isVector3(obj)) return `vector3(${obj.x}, ${obj.y}, ${obj.z})`;

    if (Array.isArray(obj)) {
        if (obj.length === 0) return "{}";

        return `{
${obj.map((v) => pad(indent + 1) + toLua(v, indent + 1, useVectors)).join(",\n")}
${pad(indent)}}`;
    }

    if (typeof obj === "object") {
        const entries = Object.entries(obj);
        if (entries.length === 0) return "{}";

        return `{
${entries
    .map(([k, v]) => `${pad(indent + 1)}["${k}"] = ${toLua(v, indent + 1, useVectors)}`)
    .join(",\n")}
${pad(indent)}}`;
    }
    return "nil";
}

function getTabSettings(tab: DataFormat, options: OptionWithCodeStr[]) {
    const option = options.find((option) => option.name === tab) || options[0];

    return {
        codeString: option.codeStr(),
        language: "lua",
        style: oneDark,
        label: option.label,
    };
}

const VisualizeDataModalContent: React.FC<{ data: any; title?: string }> = ({
    data,
    title,
}) => {
    const [tab, setTab] = useState<DataFormat>("luaVectors");
    const [open, setOpen] = useState<boolean>(false);
    const [rotationOpen, setRotationOpen] = useState<boolean>(false);
    const [rotationOrder, setRotationOrder] = useState<RotationOrder>(BASE_ROTATION_ORDER);
    const [copied, setCopied] = useState(false);
    const outputData = useMemo(
        () => withRotationOrderValues(data, rotationOrder),
        [data, rotationOrder]
    );

    const optionsWithCodeStr: OptionWithCodeStr[] = [
        {
            label: "Lua (Vectors)",
            name: "luaVectors",
            icon: <SourceIcon />,
            onClick: () => setTab("luaVectors"),
            codeStr: () => toLua(outputData, 0, true),
        },
        {
            label: "Lua",
            name: "lua",
            icon: <SourceIcon />,
            onClick: () => setTab("lua"),
            codeStr: () => toLua(outputData),
        },
        {
            label: "JSON",
            name: "json",
            icon: <SourceIcon />,
            onClick: () => setTab("json"),
            codeStr: () => JSON.stringify(outputData, null, 4),
        },
    ];

    const selectedRotationOrder =
        ROTATION_ORDER_OPTIONS.find((option) => option.value === rotationOrder) ||
        ROTATION_ORDER_OPTIONS[0];

    const rotationOptions: RotationOrderOption[] = ROTATION_ORDER_OPTIONS.map(
        ({ label, name, icon, value, descriptionItems, description }) => ({
            label,
            name,
            icon,
            value,
            descriptionItems,
            description,
            onClick: () => setRotationOrder(value),
        })
    );

    const availableOptions: DropDownItemData[] = optionsWithCodeStr.map(
        ({ label, name, icon, onClick }) => ({
            label,
            name,
            icon,
            onClick,
        })
    );

    const renderDropDownItem = (props: any) => {
        return (
            <Box
                sx={{
                    display: "flex",
                    gap: "0.3rem",
                    alignItems: "center",
                    width: "calc(100% - 2rem)",

                    "& p": {
                        fontSize: "1.3rem",

                        color: "rgba(var(--text))",
                    },

                    "& svg": {
                        fontSize: "1.3rem",
                    },
                }}
            >
                {props.icon}
                <p>{props.label}</p>
            </Box>
        );
    };

    const { codeString, language, style, label } = getTabSettings(
        tab,
        optionsWithCodeStr
    );

    const copyText = () => {
        if (!codeString) return;
        if (copied) return;

        setCopied(true);

        const textarea = document.createElement("textarea");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        textarea.value = codeString;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);

        setTimeout(() => {
            setCopied(false);
        }, 1500);
    };

    return (
        <div style={{ position: "relative" }}>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "0.75rem",
                    alignItems: "start",
                }}
            >
                <DropDown
                    items={availableOptions}
                    open={open}
                    setOpen={setOpen}
                    position="bottom-left"
                    styling={{
                        position: "absolute",
                    }}
                    closeOnClick
                    itemComponent={renderDropDownItem}
                >
                    <Button
                        buttonStyling={{
                            width: "100%",
                            marginBottom: "0.75rem",
                            marginTop: "0",
                            position: "relative",
                        }}
                        icon={<CodeIcon />}
                        onClick={() => setOpen(!open)}
                        removeDefaultComponent
                    >
                        <div
                            style={{
                                display: "flex",
                                gap: "0.3rem",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "calc(100% - 2rem)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: "1.3rem",
                                    }}
                                >
                                    {label || "MISSING LABEL"}
                                </p>
                            </div>
                        </div>
                        <UnfoldMoreIcon
                            sx={{
                                fill: "rgba(var(--secIcon)) !important",
                                width: "1.5rem",
                                height: "1.5rem",
                                position: "absolute",
                                right: "0rem",
                                top: "50%",
                                transform: "translateY(-50%)",
                            }}
                        />
                    </Button>
                </DropDown>

                <DropDown
                    items={rotationOptions}
                    open={rotationOpen}
                    setOpen={setRotationOpen}
                    position="bottom-left"
                    styling={{
                        position: "absolute",
                    }}
                    closeOnClick
                >
                    <Button
                        buttonStyling={{
                            width: "100%",
                            marginBottom: "0.75rem",
                            marginTop: "0",
                            position: "relative",
                        }}
                        icon={<RotateRightIcon />}
                        onClick={() => setRotationOpen(!rotationOpen)}
                        removeDefaultComponent
                    >
                        <div
                            style={{
                                display: "flex",
                                gap: "0.3rem",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "calc(100% - 2rem)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                    minWidth: 0,
                                    width: "100%",
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: "1.3rem",
                                        textAlign: "left",
                                    }}
                                >
                                    {selectedRotationOrder.label}
                                </p>
                            </div>
                        </div>
                        <UnfoldMoreIcon
                            sx={{
                                fill: "rgba(var(--secIcon)) !important",
                                width: "1.5rem",
                                height: "1.5rem",
                                position: "absolute",
                                right: "0rem",
                                top: "50%",
                                transform: "translateY(-50%)",
                            }}
                        />
                    </Button>
                </DropDown>
            </div>

            <div
                style={{
                    background: "rgb(var(--dark4))",
                    boxSizing: "border-box",
                    borderRadius: "var(--lborderRadius)",
                    border: "1px solid rgb(var(--grey4))",
                    boxShadow: "0 0 0.5rem rgba(0, 0, 0, 0.2)",
                    height: "100%",
                    minHeight: "10rem",
                    position: "relative",
                    padding: "0",
                    margin: "0",
                }}
            >
                {title ? (
                    <div
                        style={{
                            background: "rgb(var(--grey))",
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.25rem 0.25rem 0.25rem 1rem",
                            boxSizing: "border-box",
                            borderBottom: "1px solid rgb(var(--grey4))",
                        }}
                    >
                        <p
                            style={{
                                fontSize: "1.4rem",
                                color: "rgba(var(--secText))",
                            }}
                        >
                            {title}
                        </p>

                        <IconButton
                            onClick={copyText}
                            plain
                            iconStyling={{
                                fill: "rgba(var(--secIcon))",
                                fontSize: "1.8rem",
                            }}
                        >
                            {copied ? <CheckIcon /> : <IoIosCopy />}
                        </IconButton>
                    </div>
                ) : (
                    <IconButton
                        onClick={copyText}
                        plain
                        buttonStyling={{
                            position: "absolute",
                            right: "0.5rem",
                            top: "0.5rem",
                        }}
                        iconStyling={{
                            fill: "rgba(var(--secIcon))",
                            fontSize: "1.8rem",
                        }}
                    >
                        {copied ? <CheckIcon /> : <IoIosCopy />}
                    </IconButton>
                )}
                <SyntaxHighlighter
                    language={language}
                    style={style}
                    className="force-selectable"
                    customStyle={{
                        background: "none",
                        margin: 0,
                        fontSize: "1.4rem",
                        color: "rgba(var(--text))",
                        padding: "1rem 5rem 1rem 1rem",
                    }}
                    wrapLongLines={true}
                    codeTagProps={{}}
                >
                    {codeString}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

interface VisualizeDataContextType {
    openVisualizeModal: (data: any, title?: string) => void;
}

const VisualizeDataContext = createContext<
    VisualizeDataContextType | undefined
>(undefined);

export const VisualizeDataProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const T = useTranslation();
    const { openModal } = useModalContext();
    const modalId = "visualizeDataModal";
    const [modalData, setModalData] = useState<{
        data: any;
        title?: string;
    } | null>(null);

    const openVisualizeModal = (data: any, title?: string) => {
        setModalData({ data, title });
        openModal(modalId);
    };

    return (
        <VisualizeDataContext.Provider value={{ openVisualizeModal }}>
            {children}

            <Modal
                id={modalId}
                title={T("visualizeData")}
                icon={<CodeIcon />}
                closeButton
                onExited={() => {
                    setModalData(null);
                }}
                childrenContainerStyling={{
                    minWidth: "50rem",
                    maxWidth: "60vw",
                    maxHeight: "80vh",
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
            >
                <VisualizeDataModalContent
                    data={modalData?.data}
                    title={modalData?.title}
                />
            </Modal>
        </VisualizeDataContext.Provider>
    );
};

export function useVisualizeData() {
    const ctx = useContext(VisualizeDataContext);
    if (!ctx)
        throw new Error(
            "useVisualizeData must be used within a VisualizeDataProvider"
        );

    return ctx;
}
