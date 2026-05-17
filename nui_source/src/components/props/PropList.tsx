import React from "react";
import PropAlignments from "./PropAlignments";
import { AlignmentData, Bone } from "../../types";
import Button from "../utils/Button";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "../../context/Translation";
import SectionTitle from "../utils/SectionTitle";
import { useFieldRestriction } from "../../context/FieldRestrictions";

interface PropListProps {
    editingData: AlignmentData;
    setEditingData: React.Dispatch<React.SetStateAction<AlignmentData>>;
    bones: Bone[];
    addbaseProp: () => Promise<void>;
    hasInvalidModels: boolean;
    showStarterTooltip: boolean;
    onStarterTooltipDismiss: () => void;
}

const PropList: React.FC<PropListProps> = ({
    editingData,
    setEditingData,
    bones,
    addbaseProp,
    hasInvalidModels,
    showStarterTooltip,
    onStarterTooltipDismiss,
}) => {
    const T = useTranslation();
    const propRestriction = useFieldRestriction("props");
    const hasReachedMaxProps =
        propRestriction.maxCount !== undefined &&
        editingData.props.length >= propRestriction.maxCount;
    const addPropDisabled =
        hasInvalidModels || propRestriction.disabled || hasReachedMaxProps;

    return (
        <>
            <SectionTitle text={T("propList")} />
            <div>
                {editingData.props.map((prop, idx) => (
                    <PropAlignments
                        key={"prop-" + prop.tempId}
                        idx={idx}
                        {...prop}
                        setEditingData={setEditingData}
                        totalProps={editingData.props.length}
                        bones={bones}
                        showStarterTooltip={
                            showStarterTooltip &&
                            idx === 0 &&
                            editingData.props.length === 1 &&
                            prop.prop.length === 0
                        }
                        onStarterTooltipDismiss={onStarterTooltipDismiss}
                    />
                ))}
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "end",
                }}
            >
                <Button
                    color="rgba(var(--blue2))"
                    icon={<AddIcon />}
                    onClick={async () => await addbaseProp()}
                    disabled={addPropDisabled}
                    tooltipLabel={
                        addPropDisabled && !hasInvalidModels
                            ? propRestriction.tooltip
                            : undefined
                    }
                >
                    {T(
                        editingData.props.length > 0
                            ? "addMoreProps"
                            : "addFirstProp"
                    )}
                </Button>
            </div>
        </>
    );
};

export default PropList;
