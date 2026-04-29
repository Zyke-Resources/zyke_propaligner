import { Suspense, useRef, useState, useEffect, useCallback } from "react";
import { TransformControls } from "@react-three/drei";
import { Matrix4, Mesh, Quaternion, Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { listen, send } from "../utils/nui-events";

type alignmentMode = "prop" | "particle";

interface GizmoReset {
    handle: null;
}

interface Vec3 {
    x: number;
    y: number;
    z: number;
}

interface Quat {
    x: number;
    y: number;
    z: number;
    w: number;
}

interface GizmoData {
    handle: number | null;
    position: Vec3;
    quaternion: Quat;
    currMode: alignmentMode;
}

const gtaToThreePos = (v: Vec3): Vector3 =>
    new Vector3(v.x, v.z, -v.y);

const threeToGtaPos = (v: Vector3): Vec3 => ({
    x: v.x,
    y: -v.z,
    z: v.y,
});

const gtaToThreeQuat = (q: Quat): Quaternion =>
    new Quaternion(q.x, q.z, -q.y, q.w);

const threeToGtaQuat = (q: Quaternion): Quat => ({
    x: q.x,
    y: -q.z,
    z: q.y,
    w: q.w,
});

export const TransformComponent = () => {
    const { camera } = useThree();
    const mesh = useRef<Mesh>(null!);
    const controls = useRef<any>(null);
    const [currentEntity, setCurrentEntity] = useState<number | null>();
    const [currMode, setCurrMode] = useState<alignmentMode>("prop");
    const [editorMode, setEditorMode] = useState<"translate" | "rotate" | undefined>("translate");
    const isDragging = useRef(false);
    const currentEntityRef = useRef<number | null>();
    const propQuatRef = useRef<Quaternion>(new Quaternion());
    const editorModeRef = useRef(editorMode);

    useEffect(() => {
        currentEntityRef.current = currentEntity;
    }, [currentEntity]);

    useEffect(() => {
        editorModeRef.current = editorMode;
        if (!mesh.current) return;
        if (editorMode === "rotate") {
            mesh.current.quaternion.copy(propQuatRef.current);
        }
    }, [editorMode]);

    const _camRight = new Vector3();
    const _basisRight = new Vector3();
    const _basisUp = new Vector3(0, 1, 0);
    const _basisForward = new Vector3();
    const _basisMatrix = new Matrix4();

    useFrame(() => {
        if (!mesh.current || isDragging.current) return;
        if (editorModeRef.current === "translate") {
            _camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
            _basisRight.set(_camRight.x, 0, _camRight.z);
            if (_basisRight.lengthSq() < 0.0001) {
                _basisRight.set(1, 0, 0);
            }
            _basisRight.normalize();
            _basisForward.crossVectors(_basisRight, _basisUp).normalize();
            _basisMatrix.makeBasis(_basisRight, _basisUp, _basisForward);
            mesh.current.quaternion.setFromRotationMatrix(_basisMatrix);
        }
    });

    const handleObjectDataUpdate = useCallback(() => {
        if (!isDragging.current) return;

        const gtaPos = threeToGtaPos(mesh.current.position);
        const gtaQuat = editorModeRef.current === "rotate"
            ? threeToGtaQuat(mesh.current.quaternion)
            : threeToGtaQuat(propQuatRef.current);

        send("moveEntity", {
            handle: currentEntityRef.current,
            position: gtaPos,
            quaternion: gtaQuat,
        }, "moveEntity");
    }, []);

    const applyGizmoTransform = useCallback((position: Vec3, quaternion: Quat) => {
        mesh.current.position.copy(gtaToThreePos(position));
        const threeQuat = gtaToThreeQuat(quaternion);
        propQuatRef.current.copy(threeQuat);

        if (editorModeRef.current === "rotate") {
            mesh.current.quaternion.copy(threeQuat);
        }
    }, []);

    useEffect(() => {
        const ctrl = controls.current;
        if (!ctrl) return;

        const onDraggingChanged = (e: any) => {
            isDragging.current = e.value;
            if (!e.value) {
                send("endDrag", {}, "endDrag");
            }
        };

        ctrl.addEventListener("dragging-changed", onDraggingChanged);

        ctrl.traverse((child: any) => {
            child.frustumCulled = false;
        });

        return () => {
            ctrl.removeEventListener("dragging-changed", onDraggingChanged);
        };
    }, [currentEntity]);

    listen("setGizmoEntity", (entity: GizmoReset | GizmoData) => {
        setCurrentEntity(entity.handle);
        if (!entity.handle) return;

        setCurrMode(entity.currMode);

        if (entity.currMode === "particle" && editorMode === "rotate") {
            setEditorMode("translate");
        }

        applyGizmoTransform(entity.position, entity.quaternion);
    });

    listen("syncGizmoTransform", (data: { position: Vec3; quaternion: Quat }) => {
        if (isDragging.current) return;

        applyGizmoTransform(data.position, data.quaternion);
    });

    listen("GizmoBlur", () => {
        if (!controls.current) return;
        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
            canvas.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
        }
    });

    useEffect(() => {
        const keyHandler = (e: KeyboardEvent) => {
            switch (e.code) {
                case "KeyR":
                    if (currMode === "particle") return;

                    const newMode =
                        editorMode === "rotate" ? "translate" : "rotate";

                    setEditorMode(newMode);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener("keydown", keyHandler);
        return () => window.removeEventListener("keydown", keyHandler);
    }, [editorMode, currMode]);

    return (
        <>
            <Suspense fallback={<p>Loading Gizmo</p>}>
                {currentEntity != null && (
                    <TransformControls
                        ref={controls}
                        size={0.5}
                        object={mesh}
                        mode={editorMode}
                        space="local"
                        onObjectChange={handleObjectDataUpdate}
                        frustumCulled={false}
                    />
                )}
                <mesh ref={mesh} frustumCulled={false} />
            </Suspense>
        </>
    );
};
