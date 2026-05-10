import React, { createContext, ReactNode, useContext, useMemo } from "react";
import { FieldRestriction } from "../types";

export interface ResolvedFieldRestriction {
    disabled: boolean;
    tooltip?: string;
    maxCount?: number;
}

const FieldRestrictionsContext = createContext<
    Record<string, FieldRestriction>
>({});

const defaultRestriction: ResolvedFieldRestriction = {
    disabled: false,
};

const normalizeRestriction = (
    restriction: FieldRestriction
): ResolvedFieldRestriction => {
    if (typeof restriction === "string") {
        return { disabled: true, tooltip: restriction };
    }

    if (typeof restriction === "boolean") {
        return { disabled: restriction };
    }

    return {
        disabled:
            restriction.disabled !== undefined
                ? restriction.disabled
                : restriction.maxCount === undefined,
        tooltip: restriction.tooltip,
        maxCount: restriction.maxCount,
    };
};

const getRestrictionKeys = (key: string): string[] => {
    const parts = key.split(".");

    return parts.map((_, idx) => parts.slice(0, idx + 1).join("."));
};

export const resolveFieldRestriction = (
    restrictedFields: Record<string, FieldRestriction> | undefined,
    key: string
): ResolvedFieldRestriction => {
    if (!restrictedFields) return defaultRestriction;

    let resolved = defaultRestriction;

    for (const restrictionKey of getRestrictionKeys(key)) {
        const restriction = restrictedFields[restrictionKey];
        if (restriction === undefined) continue;

        resolved = normalizeRestriction(restriction);
    }

    return resolved;
};

export const useFieldRestriction = (key: string): ResolvedFieldRestriction => {
    const restrictedFields = useContext(FieldRestrictionsContext);

    return resolveFieldRestriction(restrictedFields, key);
};

export const FieldRestrictionsProvider: React.FC<{
    restrictedFields?: Record<string, FieldRestriction>;
    children: ReactNode;
}> = ({ restrictedFields, children }) => {
    const value = useMemo(() => restrictedFields || {}, [restrictedFields]);

    return (
        <FieldRestrictionsContext.Provider value={value}>
            {children}
        </FieldRestrictionsContext.Provider>
    );
};
