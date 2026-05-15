import React, { createContext, useContext, ReactNode, useState } from "react";
import Modal from "../components/utils/Modal";
import { useModalContext } from "./ModalContext";
import Button from "../components/utils/Button";
import DropDown, { DropDownItemData } from "../components/utils/DropDown";
import { Box } from "@mantine/core";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import DottedBackground from "../components/utils/DottedBackground";
import IconButton from "../components/utils/IconButton";
import CheckIcon from "@mui/icons-material/Check";
import { IoIosCopy } from "react-icons/io";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import CodeIcon from "@mui/icons-material/Code";
import { useTranslation } from "./Translation";
import SourceIcon from "@mui/icons-material/Source";

type OptionWithCodeStr = DropDownItemData & {
    codeStr: () => string;
};

type DataFormat = "lua" | "luaVectors" | "json";

// Utility to convert JS object to indented Lua string
function toLua(obj: any, indent = 0, useVectors = false): string {
    const pad = (n: number) => "    ".repeat(n);
    const isVector3 = (value: any) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) return false;

        const keys = Object.keys(value);
        return (
            keys.length === 3 &&
            keys.includes("x") &&
            keys.includes("y") &&
            keys.includes("z") &&
            typeof value.x === "number" &&
            typeof value.y === "number" &&
            typeof value.z === "number"
        );
    };

    if (obj === null) return "nil";
    if (typeof obj === "string") return `"${obj.replace(/"/g, '"')}"`;
    if (typeof obj === "number" || typeof obj === "boolean")
        return obj.toString();
    if (useVectors && isVector3(obj)) return `vector3(${obj.x}, ${obj.y}, ${obj.z})`;

    if (Array.isArray(obj)) {
        return `{
${obj.map((v) => pad(indent + 1) + toLua(v, indent + 1, useVectors)).join(",\n")}
${pad(indent)}}`;
    }

    if (typeof obj === "object") {
        return `{
${Object.entries(obj)
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
    const [tab, setTab] = useState<DataFormat>("lua");
    const [open, setOpen] = useState<boolean>(false);
    const [copied, setCopied] = useState(false);

    const optionsWithCodeStr: OptionWithCodeStr[] = [
        {
            label: "Lua",
            name: "lua",
            icon: <SourceIcon />,
            onClick: () => setTab("lua"),
            codeStr: () => toLua(data),
        },
        {
            label: "Lua (Vectors)",
            name: "luaVectors",
            icon: <SourceIcon />,
            onClick: () => setTab("luaVectors"),
            codeStr: () => toLua(data, 0, true),
        },
        {
            label: "JSON",
            name: "json",
            icon: <SourceIcon />,
            onClick: () => setTab("json"),
            codeStr: () => JSON.stringify(data, null, 4),
        },
    ];

    const availableOptions: DropDownItemData[] = optionsWithCodeStr.map(
        ({ label, name, icon, onClick }) => ({
            label,
            name,
            icon,
            onClick,
        })
    );

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
                    width: "20rem",
                }}
            >
                <DropDown
                    items={availableOptions}
                    open={open}
                    setOpen={setOpen}
                    position="bottom"
                    styling={{
                        position: "absolute",
                    }}
                    closeOnClick
                    itemComponent={(props) => {
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
                    }}
                >
                    <DottedBackground />
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
