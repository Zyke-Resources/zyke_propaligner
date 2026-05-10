import { Box, Button as MUIButton, SxProps, Theme } from "@mui/material";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import ContentPasteGoIcon from "@mui/icons-material/ContentPasteGo";
import CheckIcon from "@mui/icons-material/Check";
import _color from "./Color";
import { Loader } from "@mantine/core";
import GetVarValue from "./GetVarValue";
import chroma, { Color } from "chroma-js";
import React, { useState } from "react";
import Tooltip from "./Tooltip";

export interface ButtonProps {
    icon?: React.ReactNode;
    rightIcon?: "dialog" | "newPage" | "confirm";
    useRightIconAnimation?: boolean;
    tooltipLabel?: string | undefined;
    tooltipOpened?: boolean;
    tooltipWithArrow?: boolean;
    tooltipPosition?:
        | "bottom"
        | "left"
        | "right"
        | "top"
        | "bottom-end"
        | "bottom-start"
        | "left-end"
        | "left-start"
        | "right-end"
        | "right-start"
        | "top-end"
        | "top-start";
    disableRipple?: boolean;

    hollow?: boolean;
    removeDefaultComponent?: boolean;
    color?: string;
    buttonStyling?: SxProps<Theme>;
    boxStyling?: SxProps<Theme>;
    textStyling?: React.CSSProperties;
    iconStyling?: React.CSSProperties;
    textContainerStyling?: SxProps<Theme>;
    wide?: boolean;

    disabled?: boolean;
    loading?: boolean;
    loadDelay?: number | [number, number]; // Artifical delay when loading and pressing buttons
    shouldLoad?: () => boolean;

    onClick?: (e?: React.MouseEventHandler<HTMLButtonElement>) => void;
    onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;

    children: React.ReactNode;
}

const rightIcons = {
    ["dialog"]: <ContentPasteGoIcon className="rightIcon" />,
    ["newPage"]: <KeyboardDoubleArrowRightIcon className="rightIcon" />,
    ["confirm"]: <CheckIcon className="rightIcon" />,
};

const Button: React.FC<ButtonProps> = ({
    icon,
    rightIcon,
    useRightIconAnimation,
    tooltipLabel,
    tooltipOpened,
    tooltipWithArrow,
    tooltipPosition,
    disableRipple = false,

    hollow = false,
    removeDefaultComponent,
    color,
    buttonStyling,
    boxStyling,
    iconStyling,
    textStyling,
    textContainerStyling,
    wide, // Width 100%, centering content

    disabled,
    loading = false,
    loadDelay, // Artifical delay when loading and pressing buttons
    shouldLoad,

    onClick,
    onMouseEnter,
    onMouseLeave,

    children,
}) => {
    // const [_loading, setLoading] = useState(false);
    const [internalLoading, setInternalLoading] = useState(false);
    const isLoading = loading || internalLoading;

    const isClickDisabled = disabled || isLoading || false;
    const { backgroundColor, borderColor, textColor, hoverValue } = getColor(
        hollow,
        color,
        isClickDisabled
    );

    const _onClick = () => {
        let _shouldLoad = true;
        if (shouldLoad) _shouldLoad = shouldLoad();

        if (loadDelay && _shouldLoad) {
            setInternalLoading(true);

            let toWait;
            if (Array.isArray(loadDelay)) {
                toWait =
                    loadDelay[0] +
                    Math.random() * (loadDelay[1] - loadDelay[0]);
            } else {
                toWait = loadDelay;
            }

            setTimeout(async () => {
                if (onClick) {
                    await onClick();
                }

                setInternalLoading(false);
            }, toWait);
        } else {
            if (onClick) onClick();
        }
    };

    const button = (
        <MUIButton
            disableRipple={disableRipple}
            variant="contained"
            onClick={_onClick}
            disabled={isClickDisabled}
            sx={{
                // Centering
                display: "flex",
                justifyContent: "start",
                alignItems: "center",

                // Text Stuff
                textTransform: "none",

                // Width & Sizing Stuff
                padding: "0.35rem 0.45rem 0.35rem 0.6rem !important",
                minPadding: "0 0 0 0 !important",
                boxSizing: "border-box",

                margin: "0.5rem 0 0 0",
                minHeight: "0 !important",
                minWidth: "0 !important",
                width: wide ? "100%" : "fit-content",
                height: "fit-content",
                borderRadius: "var(--mborderRadius)",

                // Colors
                background: `${backgroundColor} !important`,
                border: `1px solid ${borderColor.hex()} !important`,

                // Hover Main Button Div Styling
                ["&:hover"]: {
                    background: !isClickDisabled
                        ? `${hoverValue} !important`
                        : undefined,

                    // When Hovering Main, Right Icon Styling
                    ["& .rightIcon"]: {
                        transform: useRightIconAnimation
                            ? "translateX(35%)"
                            : undefined,
                    },
                },

                // Right Icon Styling
                ["& .rightIcon"]: {
                    transform: !useRightIconAnimation
                        ? "translateX(35%)"
                        : undefined,
                    marginRight: "1rem",
                },

                ...buttonStyling,
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",

                    // Icon Styling
                    "& svg": {
                        marginRight: "0.5rem",
                        fontSize: "1.5rem",
                        color: `${textColor.hex()}`,
                        fill: `${textColor.hex()}`,
                        transition: "all 0.2s ease-in-out",
                        ...iconStyling,
                    },

                    // Text Styling
                    "& p": {
                        color: `${textColor.hex()}`,
                        fontSize: "1.4rem",
                        margin: "0rem 0.2rem 0 0",
                        fontWeight: hollow ? "400" : "400",
                        transition: "all 0.2s ease-in-out",
                        ...textStyling,
                    },

                    ...boxStyling,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: wide ? "center" : "start",
                        width: "100%",

                        ...textContainerStyling,
                    }}
                >
                    {icon && (
                        <LeftIcon
                            icon={icon}
                            color={textColor.hex()}
                            loading={isLoading}
                        />
                    )}
                    {removeDefaultComponent ? children : <p>{children}</p>}
                </Box>
                {rightIcon && rightIcons[rightIcon]}
            </Box>
        </MUIButton>
    );

    if (isClickDisabled && tooltipLabel) {
        return (
            <Tooltip
                label={tooltipLabel}
                opened={tooltipOpened}
                withArrow={tooltipWithArrow}
                position={tooltipPosition}
            >
                <span
                    style={{
                        display: wide ? "block" : "inline-flex",
                        width: wide ? "100%" : "fit-content",
                    }}
                >
                    {button}
                </span>
            </Tooltip>
        );
    }

    return (
        <Tooltip
            label={tooltipLabel}
            opened={tooltipOpened}
            withArrow={tooltipWithArrow}
            position={tooltipPosition}
        >
            {button}
        </Tooltip>
    );
};

export default Button;

interface LeftIconProps {
    color: string;
    icon: React.ReactNode;
    loading?: boolean;
}

const LeftIcon: React.FC<LeftIconProps> = ({ color, icon, loading }) => {
    return loading ? (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                ["& .loader"]: {
                    marginRight: "0.5rem",
                    stroke: `${color}`,
                    fontSize: "1.5rem",
                    width: "1.5rem !important",
                    height: "1.5rem !important",
                },
            }}
        >
            <Loader className="loader" />
        </Box>
    ) : icon ? (
        <>{icon}</>
    ) : null;
};

// const { baseColor, textColor } = getColor(color);
const getColor = (hollow: boolean, color?: string, isDisabled?: boolean) => {
    //
    // Background Color
    //

    const defaultBackground = "var(--grey)";
    const baseBackground: Color = chroma(
        GetVarValue(color || defaultBackground)
    );

    let backgroundColor: Color = baseBackground;

    if (hollow) backgroundColor = baseBackground.alpha(0.2);
    if (isDisabled) {
        if (hollow) {
            backgroundColor = backgroundColor
                .darken(0.5)
                .desaturate(1.5)
                .alpha(0.1);
        } else {
            backgroundColor = backgroundColor.alpha(0.5);
        }
    }

    //
    // Border Color
    //

    let borderColor: Color | "transparent" = chroma("transparent");
    if (!hollow) {
        borderColor = baseBackground.brighten(0.2);
        if (isDisabled) borderColor = backgroundColor.alpha(0);
    }

    //
    // Text Color
    //
    const defaultText = "var(--text)";
    const baseText: Color = chroma(GetVarValue(defaultText));
    let textColor: Color = baseText;
    if (hollow) textColor = baseBackground;

    if (isDisabled) {
        if (hollow) {
            textColor = textColor.darken(0.5).desaturate(1.5);
        } else {
            textColor = textColor.alpha(0.5);
        }
    }

    return {
        backgroundColor,
        borderColor,
        textColor,
        hoverValue: backgroundColor.brighten(0.5).hex(),
    };
};
