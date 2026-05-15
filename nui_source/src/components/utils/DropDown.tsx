import { ButtonBase } from "@mui/material";
import { Fragment, useEffect, useState, useRef, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useClickOutside } from "@mantine/hooks";
import { Box, Radio } from "@mantine/core";

const defaultItemHeight = "2.3rem";
const dividerHeight = "0.1rem";
const dividerMarginTop = "0.4rem";
const dividerMarginBottom = "0.4rem";
const itemDescriptionHeight = 1.05;

// The data for the item that is passed in
export interface DropDownItemData {
    label: string;
    name: string;
    icon?: ReactNode | ((data: { style: React.CSSProperties }) => ReactNode);
    radioButton?: boolean;
    description?: string;
    descriptionItems?: string[];
    onClick?: () => void;
}

interface DropDownTitleData {
    label: string;
    isTitle: true;
    icon?: ReactNode | ((data: { style: React.CSSProperties }) => ReactNode);
}

type DropDownItemType = DropDownItemData | DropDownTitleData;
type DropDownItemHeight = string | ((item: DropDownItemType) => string);

const isDropDownItemData = (item: DropDownItemType): item is DropDownItemData => {
    return "name" in item;
};

const getDefaultItemHeight = (item: DropDownItemType) => {
    if (!isDropDownItemData(item)) return defaultItemHeight;

    const descriptionItemCount = item.descriptionItems?.length || 0;
    if (descriptionItemCount > 0) {
        return `${2.3 + descriptionItemCount * itemDescriptionHeight}rem`;
    }

    if (item.description) return `${2.3 + itemDescriptionHeight}rem`;

    return defaultItemHeight;
};

const getDropDownItemHeight = (
    itemHeight: DropDownItemHeight,
    item: DropDownItemType
) => {
    return typeof itemHeight === "function" ? itemHeight(item) : itemHeight;
};

// The item data & props to construct it in the dropdown menu
interface DropDownItem {
    isTitle?: boolean;
    setHoverIdx: (num: number | null) => void;
    idx: number;
    label: string;
    icon?: ReactNode | ((data: { style: React.CSSProperties }) => ReactNode);
    onClick?: (args: any) => void;
    closeOnClick?: boolean;
    closeDropDown: () => void;
    disabled?: boolean;
    itemComponent?: (item: any) => ReactNode;
    selected?: boolean;
    radioButton?: boolean;
    description?: string;
    descriptionItems?: string[];
    menuId: string;
    item: DropDownItemType;
    items: DropDownItemType[];
    itemHeight: string;
    globalOnClick?: (name: string) => void;
}

interface DropDownProps {
    open: boolean;
    setOpen: (state: boolean) => void;
    title?: string;
    icon?: ReactNode | ((data: { style: React.CSSProperties }) => ReactNode);
    items: DropDownItemType[];
    styling: React.CSSProperties;
    children: ReactNode;
    onClick?: () => void;
    closeOnClick?: boolean;
    position?:
        | "left-up"
        | "left"
        | "bottom"
        | "bottom-left"
        | "bottom-right"
        | "right"
        | "right-up";
    itemComponent?: (item: any) => ReactNode;
    itemHeight?: DropDownItemHeight;
}

const DropDown: React.FC<DropDownProps> = ({
    open,
    setOpen,
    title,
    icon,
    items,
    styling,
    children,
    onClick: globalOnClick,
    closeOnClick,
    position,
    itemComponent,
    itemHeight = getDefaultItemHeight,
}) => {
    const generateMenuId = () =>
        "dropdown-" + Math.random().toString(36).substr(2, 9);

    const [menuId, setMenuId] = useState<string>(() => generateMenuId());

    const ref = useClickOutside(() => {
        if (open) setOpen(false);
    });

    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const [shouldAnimateHoverBox, setShouldAnimateHoverBox] =
        useState<boolean>(false);

    const childRef = useRef<HTMLDivElement>(null);
    const [childDimensions, setChildDimensions] = useState({
        height: 0,
        width: 0,
    });

    // Disable the positioning animation for the hover box if you are not hovering over an item
    // This is to prevent weird behavior making the hover box jump around when you hover different parts when hovering outside in between
    useEffect(() => {
        setTimeout(() => {
            setShouldAnimateHoverBox(hoverIdx !== null);
        }, 1);
    }, [hoverIdx]);

    useEffect(() => {
        if (childRef.current) {
            const dimensions = childRef.current.getBoundingClientRect();

            setChildDimensions({
                height: dimensions.height / 10,
                width: dimensions.width / 10,
            });
        }
    }, [children]);

    const closeDropDown = () => setOpen(false);

    useEffect(() => {
        setHoverIdx(null);
    }, [open]);

    const [menuDimensions, setMenuDimensions] = useState({
        height: 0,
        width: 0,
    });

    let middle = menuDimensions.width / 2 - childDimensions.width / 2;
    if (middle > 0) {
        middle = -middle;
    } else {
        middle = 0 + -middle / 2;
    }

    useEffect(() => {
        if (!open) return;

        const parent = document.getElementById(menuId);
        if (parent) {
            setMenuDimensions({
                height: parent.offsetHeight / 10,
                width: parent.offsetWidth / 10,
            });
        }
    }, [open]);

    const posStyling = {
        ["left-up"]: {
            translateX: "calc(-100% - 0.5rem)",
            translateY: `calc(-${menuDimensions.height}rem + ${childDimensions.height}rem)`,
        },
        ["left"]: {
            translateX: "calc(-100% - 0.5rem)",
        },
        ["bottom"]: {
            translateY: "3rem",
            translateX: `${middle}rem`,
        },
        ["bottom-left"]: {
            translateY: "3rem",
            translateX: "0rem",
        },
        ["bottom-right"]: {
            translateY: "3.5rem",
        },
        ["right"]: {
            translateX: `calc(${childDimensions.width}rem + 0.5rem)`,
        },
        ["right-up"]: {
            translateX: `calc(${childDimensions.width}rem + 0.5rem)`,
            translateY: `calc(-${menuDimensions.height}rem + ${childDimensions.height}rem)`,
        },
    };

    position = position || "left";

    // Add the title at the top
    if (title) {
        items = [{ label: title, icon: icon, isTitle: true }, ...items];
    }

    return (
        <div
            ref={ref}
            style={{
                position: "relative",
            }}
        >
            <AnimatePresence>
                {open && (
                    <motion.div
                        id={menuId}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            position: "fixed", // Sometimes needs to be set as absolute through styling
                            background: "rgba(var(--dark), 1.0)",
                            borderRadius: "var(--lborderRadius)",
                            boxShadow: "0 0 5px rgba(0, 0, 0, 0.5)",
                            border: "1px solid rgb(var(--grey3))",
                            zIndex: 1000,
                            cursor: "default",

                            ...posStyling[position],
                            ...styling,
                        }}
                    >
                        <div
                            className="item-list"
                            style={{
                                position: "relative",
                                padding: "0.4rem",
                                boxSizing: "border-box",
                                overflow: "hidden",
                            }}
                        >
                            <HoverBox
                                menuId={menuId}
                                items={items}
                                hoverIdx={hoverIdx}
                                shouldAnimateHoverBox={shouldAnimateHoverBox}
                                itemHeight={itemHeight}
                            />

                            <ItemList
                                menuId={menuId}
                                items={items}
                                setHoverIdx={setHoverIdx}
                                shouldAnimateHoverBox={shouldAnimateHoverBox}
                                globalOnClick={globalOnClick}
                                closeOnClick={closeOnClick}
                                closeDropDown={closeDropDown}
                                itemComponent={itemComponent}
                                itemHeight={itemHeight}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div ref={childRef}>{children}</div>
        </div>
    );
};

export default DropDown;

const Item: React.FC<DropDownItem> = ({
    isTitle,
    setHoverIdx,
    idx,
    label,
    icon,
    onClick,
    closeOnClick,
    closeDropDown,
    disabled,
    itemComponent,
    selected, // If the item is marked as selected, to display an extra hoverbox for it, in blue
    radioButton,
    description,
    descriptionItems,
    menuId,
    item, // Pass the whole item object to the item component
    items,
    itemHeight,
    globalOnClick,
}) => {
    return (
        <>
            {selected && (
                <HoverBox
                    menuId={menuId}
                    items={items}
                    hoverIdx={idx}
                    shouldAnimateHoverBox={false}
                    itemHeight={itemHeight}
                    selected={true}
                />
            )}

            <ButtonBase
                // disableRipple={isTitle}
                disabled={isTitle || disabled}
                onClick={(args: any) => {
                    if (!("name" in item)) return;

                    if (closeOnClick) closeDropDown();
                    if (globalOnClick) globalOnClick(item.name);
                    if (onClick) onClick(args);
                }}
                style={{
                    display: "flex",
                    justifyContent: "start",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "var(--spadding) var(--mpadding)",
                    width: "100%",
                    height: itemHeight,
                }}
                onMouseEnter={() => {
                    !isTitle && setHoverIdx(idx);
                }}
                onMouseLeave={() => {
                    !isTitle && setHoverIdx(null);
                }}
            >
                {itemComponent ? (
                    itemComponent(item)
                ) : (
                    <>
                        {radioButton !== null && radioButton !== undefined && (
                            <Radio
                                checked={radioButton ? true : false}
                                readOnly
                            />
                        )}

                        {icon && (
                            <ItemIcon
                                isTitle={isTitle}
                                icon={icon}
                                disabled={disabled}
                            />
                        )}
                        <ItemContent
                            label={label}
                            disabled={disabled}
                            isTitle={isTitle}
                            description={description}
                            descriptionItems={descriptionItems}
                        />
                    </>
                )}
            </ButtonBase>
        </>
    );
};

interface ItemContentProps {
    label: string;
    disabled?: boolean;
    isTitle?: boolean;
    description?: string;
    descriptionItems?: string[];
}

const ItemContent: React.FC<ItemContentProps> = ({
    label,
    disabled,
    isTitle,
    description,
    descriptionItems,
}) => {
    const hasDescriptionItems = Boolean(descriptionItems?.length);
    const showDescription = !hasDescriptionItems && Boolean(description);
    const textColor =
        disabled || isTitle ? "rgba(var(--secText))" : "rgba(var(--text))";

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                minWidth: 0,
                width: "100%",
                textAlign: "left",
            }}
        >
            <p
                className="truncate"
                style={{
                    cursor: "pointer",
                    color: textColor,
                    fontSize: "1.2rem",
                    fontWeight: "400",
                    lineHeight: 1.1,
                    margin: 0,
                    textAlign: "left",
                    width: "100%",
                }}
            >
                {label}
            </p>

            {hasDescriptionItems ? (
                <div style={{ width: "100%" }}>
                    {descriptionItems?.map((item) => (
                        <p
                            key={item}
                            style={{
                                color: "rgba(var(--secText))",
                                fontSize: "0.95rem",
                                fontWeight: 500,
                                lineHeight: 1.1,
                                margin: 0,
                                textAlign: "left",
                                whiteSpace: "normal",
                            }}
                        >
                            - {item}
                        </p>
                    ))}
                </div>
            ) : null}

            {showDescription ? (
                <p
                    style={{
                        color: "rgba(var(--secText))",
                        fontSize: "0.95rem",
                        lineHeight: 1.1,
                        margin: 0,
                        textAlign: "left",
                        whiteSpace: "normal",
                    }}
                >
                    {description}
                </p>
            ) : null}
        </div>
    );
};

interface ItemListProps {
    items: DropDownItemType[];
    setHoverIdx: (num: number | null) => void;
    shouldAnimateHoverBox: boolean;
    closeOnClick?: boolean;
    closeDropDown: () => void;
    itemComponent?: (item: any) => ReactNode;
    itemHeight: DropDownItemHeight;
    menuId: string;
    globalOnClick?: (name: string) => void;
}

const ItemList: React.FC<ItemListProps> = ({
    items,
    setHoverIdx,
    closeOnClick,
    closeDropDown,
    itemComponent,
    itemHeight,
    menuId,
    globalOnClick,
}) => {
    return (
        <>
            {items.map((item, idx) => {
                return "name" in item ? (
                    <Fragment key={item.name + "-" + idx}>
                        <Item
                            idx={idx}
                            item={item}
                            menuId={menuId}
                            items={items}
                            closeOnClick={closeOnClick}
                            closeDropDown={closeDropDown}
                            setHoverIdx={setHoverIdx}
                            itemComponent={itemComponent}
                            itemHeight={getDropDownItemHeight(itemHeight, item)}
                            globalOnClick={globalOnClick}
                            {...item}
                        />
                    </Fragment>
                ) : (
                    <Fragment key={"title" + "-" + idx}>
                        <Item
                            idx={idx}
                            item={item}
                            menuId={menuId}
                            items={items}
                            closeOnClick={closeOnClick}
                            closeDropDown={closeDropDown}
                            setHoverIdx={setHoverIdx}
                            itemComponent={itemComponent}
                            itemHeight={getDropDownItemHeight(itemHeight, item)}
                            globalOnClick={globalOnClick}
                            {...item}
                        />

                        <Divider />
                    </Fragment>
                );
            })}
        </>
    );
};

const HoverBox: React.FC<{
    menuId: string;
    items: DropDownItemType[];
    hoverIdx: number | null;
    shouldAnimateHoverBox: boolean;
    itemHeight: DropDownItemHeight;
    selected?: boolean;
}> = ({ menuId, items, hoverIdx, shouldAnimateHoverBox, itemHeight, selected }) => {
    const lastHoverIdx = useRef<number | null>(null);

    if (hoverIdx !== null) {
        lastHoverIdx.current = hoverIdx;
    }

    const visualIdx = hoverIdx ?? lastHoverIdx.current;
    const activeItem = visualIdx !== null ? items[visualIdx] : undefined;
    const activeItemHeight = activeItem
        ? getDropDownItemHeight(itemHeight, activeItem)
        : defaultItemHeight;

    const previousItems = visualIdx !== null ? items.slice(0, visualIdx) : [];
    const previousHeights = previousItems.map((item) =>
        getDropDownItemHeight(itemHeight, item)
    );
    const itemHeightCalc =
        previousHeights.length > 0 ? `calc(${previousHeights.join(" + ")})` : "0rem";
    const dividersBefore = previousItems.filter((item) => !("name" in item)).length;

    const totalDividerHeightCalc = `calc(${dividerHeight} + ${dividerMarginTop} + ${dividerMarginBottom})`;
    const totalDividersCalc = `calc(${dividersBefore} * ${totalDividerHeightCalc})`;

    return (
        <motion.div
            className="hover-box"
            style={{
                width: "100%",
                height: activeItemHeight,
                position: "absolute",
                top: `calc(${itemHeightCalc} + ${totalDividersCalc})`,
                left: 0,
                zIndex: -1,
                padding: "0 0.4rem",
                marginTop: "0.4rem",
                opacity: hoverIdx !== null ? 1 : 0,
                transition: shouldAnimateHoverBox
                    ? "top 0.14s ease, height 0.14s ease, opacity 0.2s"
                    : "opacity 0.2s, top 0s, height 0s",
            }}
        >
            <div
                style={{
                    background: selected
                        ? "rgba(var(--blue2), 1.0)"
                        : "rgba(var(--grey3), 1.0)",
                    width: "calc(100% - 0.8rem)",
                    height: activeItemHeight,
                    borderRadius: "var(--borderRadius)",
                    scale: hoverIdx !== null ? "1" : "0.9",
                    transition: shouldAnimateHoverBox
                        ? "scale 0.4s, height 0.14s ease"
                        : "scale 0.4s, height 0s",
                }}
            ></div>
        </motion.div>
    );
};

const Divider = () => {
    return (
        <div
            className="divider"
            style={{
                width: "100%",
                height: dividerHeight,
                background: "rgba(var(--grey3))",
                marginTop: dividerMarginTop,
                marginBottom: dividerMarginBottom,
            }}
        ></div>
    );
};

interface ItemIconProps {
    icon: ReactNode | ((data: { style: React.CSSProperties }) => ReactNode);
    disabled?: boolean;
    isTitle?: boolean;
}

const ItemIcon: React.FC<ItemIconProps> = ({ icon, disabled, isTitle }) => {
    const fill = "rgba(var(--icon))";
    const disabledFill = "rgba(var(--secIcon))";
    const fillToUse = disabled || isTitle ? disabledFill : fill;
    const marginRight = "0.25rem";

    return (
        <>
            {typeof icon === "function" ? (
                icon({
                    style: {
                        height: "1.4rem",
                        width: "1.4rem",
                        fill: fillToUse,
                        marginRight: marginRight,
                    },
                })
            ) : (
                <Box
                    sx={{
                        "& svg": {
                            height: "1.4rem",
                            width: "1.4rem",
                            fill: fillToUse,
                            marginRight: marginRight,
                        },
                    }}
                >
                    {icon}
                </Box>
            )}
        </>
    );
};
