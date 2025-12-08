import React, { useEffect, useRef, useState } from "react";
import TextInput from "../utils/TextInput";
import { MdAnimation } from "react-icons/md";
import { AlignmentData } from "../../types";
import { useTranslation } from "../../context/Translation";
import { callback } from "../utils/nui-events";
import { useDebouncedValue } from "@mantine/hooks";

interface animValidation {
    hasEdited: boolean;
    valid: boolean;
}

const AnimationSection = ({
    editingData,
    setEditingData,
}: {
    editingData: AlignmentData;
    setEditingData: React.Dispatch<React.SetStateAction<AlignmentData>>;
}) => {
    const T = useTranslation();
    const [debouncedDict] = useDebouncedValue(editingData.dict, 500);
    const firstDict = useRef(true);

    const [debouncedClip] = useDebouncedValue(editingData.clip, 500);
    const firstClip = useRef(true);

    const [isAnimValid, setIsAnimValid] = useState<{
        dict: animValidation;
        clip: animValidation;
    }>({
        dict: {
            hasEdited: false,
            valid: true,
        },
        clip: {
            hasEdited: false,
            valid: true,
        },
    });

    useEffect(() => {
        if (firstDict.current) {
            firstDict.current = false;
            return;
        }

        callback("IsAnimValid", {
            dict: editingData.dict,
            clip: editingData.clip,
        }).then((res: { dict: boolean; clip: boolean }) =>
            setIsAnimValid((prev) => ({
                ...prev,
                dict: { hasEdited: true, valid: res.dict },
            }))
        );
    }, [debouncedDict]);

    useEffect(() => {
        if (firstClip.current) {
            firstClip.current = false;
            return;
        }

        callback("IsAnimValid", {
            dict: editingData.dict,
            clip: editingData.clip,
        }).then((res: { dict: boolean; clip: boolean }) =>
            setIsAnimValid((prev) => ({
                ...prev,
                clip: { hasEdited: true, valid: res.clip },
            }))
        );
    }, [debouncedClip]);

    // If our entire animation combination is empty, we don't show the "invalid" errors since we allow alignment without an animation
    // But if one of the inputs is empty whilst the other one isn't, it would be an invalid combination
    const animComboEmpty = editingData.dict === "" && editingData.clip === "";

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
            }}
        >
            <TextInput
                icon={<MdAnimation />}
                label={T("animationDict")}
                value={editingData.dict}
                error={
                    isAnimValid.dict.hasEdited && !isAnimValid.dict.valid && !animComboEmpty
                        ? T("invalid")
                        : undefined
                }
                onChange={(e) =>
                    setEditingData((prev) => ({
                        ...prev,
                        dict: e.target.value,
                    }))
                }
            />
            <TextInput
                icon={<MdAnimation />}
                label={T("animationClip")}
                value={editingData.clip}
                error={
                    isAnimValid.clip.hasEdited && !isAnimValid.clip.valid && !animComboEmpty
                        ? T("invalid")
                        : undefined
                }
                onChange={(e) =>
                    setEditingData((prev) => ({
                        ...prev,
                        clip: e.target.value,
                    }))
                }
            />
        </div>
    );
};

export default AnimationSection;
