import { Tooltip as MantineTooltip } from "@mantine/core";

interface TooltipProps {
    disabled?: boolean;
    label?: string | undefined;
    opened?: boolean;
    children: React.ReactElement;
    withArrow?: boolean;
    position?:
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
}

const Tooltip: React.FC<TooltipProps> = ({
    disabled,
    label,
    opened,
    children,
    withArrow,
    position,
}) => {
    return (
        <>
            {label ? (
                !disabled ? (
                    <MantineTooltip
                        label={label}
                        opened={opened}
                        withArrow={withArrow}
                        arrowSize={12}
                        position={position}
                        withinPortal
                        zIndex={10000}
                        multiline
                        style={{
                            maxWidth: "220px",
                            textAlign: "center",
                        }}
                    >
                        {children}
                    </MantineTooltip>
                ) : (
                    <>{children}</>
                )
            ) : (
                <>{children}</>
            )}
        </>
    );
};

export default Tooltip;
