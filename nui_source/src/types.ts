export interface OpenedModal {
    canClose: boolean;
    onClose: (() => void) | null;
    [key: string]: any;
}

export interface ParticleAlignmentData {
    dict: string;
    clip: string;
    offset: { x: number; y: number; z: number };
    size: number;
}

export type FieldRestriction =
    | boolean
    | string
    | {
          disabled?: boolean;
          tooltip?: string;
      };

export interface AlignmentData {
    dict: string;
    clip: string;
    props: PropAlignmentData[];
    restrictedFields?: Record<string, FieldRestriction>;
    created?: number; // Saved in database and may exist, but not used in the alignment
}

export interface PropAlignmentData {
    prop: string;
    bone: number;
    offset: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    particles: ParticleAlignmentData[] | null;
    tempId: number;
}

export interface HistoryData extends AlignmentData {
    created: number;
}

export interface Preset {
    id: string;
    label: string;
    data: AlignmentData;
    last_used: number;
}

export interface NewPresetData {
    label: string;
    data: AlignmentData;
}

export interface Bone {
    label: string;
    name: string;
    value: string;
    id: number;
    idx: number;
}
