import React, { useEffect, useRef, useState } from "react";
import TextInput from "../utils/TextInput";
import Select from "../utils/Select";
import { MdAnimation } from "react-icons/md";
import { AlignmentData } from "../../types";
import { useTranslation } from "../../context/Translation";
import { callback } from "../utils/nui-events";
import { useDebouncedValue } from "@mantine/hooks";
import { Animation } from "../MainMenu";

interface animValidation {
    hasEdited: boolean;
    valid: boolean;
}

const AnimationSection = ({
    editingData,
    setEditingData,
    animations,
}: {
    editingData: AlignmentData;
    setEditingData: React.Dispatch<React.SetStateAction<AlignmentData>>;
    animations: Animation[];
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
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "1rem",
                paddingTop: "0.75rem"
            }}
        >
            <Select
                label={T("baseAnimations")}
                icon={<MdAnimation />}
                placeholder={"Custom"}
                value={editingData.dict + ":" + editingData.clip}
                content={animations.map((item) => ({
                    label: item.label,
                    name: item.dict + ":" + item.clip,
                }))}
                onChange={(value) => {
                    const [dict, clip] = value.split(":");

                    setEditingData((prev) => ({
                        ...prev,
                        dict,
                        clip,
                    }));
                }}
                style={{ paddingTop: "0" }}
            />
            <TextInput
                icon={<MdAnimation />}
                label={T("animationDict")}
                placeholder={T("animationDict")}
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
                style={{ paddingTop: "0" }}
            />
            <TextInput
                icon={<MdAnimation />}
                label={T("animationClip")}
                placeholder={T("animationClip")}
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
                style={{ paddingTop: "0" }}
            />
        </div>
    );
};

export default AnimationSection;
