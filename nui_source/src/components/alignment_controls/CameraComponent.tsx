import { useRef } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera as PCam, Vector3 } from "three";
import { listen } from "../utils/nui-events";

const gtaToThreeVec = (v: { x: number; y: number; z: number }) =>
    new Vector3(v.x, v.z, -v.y);

interface CameraData {
    position: { x: number; y: number; z: number };
    forward?: { x: number; y: number; z: number };
    up?: { x: number; y: number; z: number };
    fov?: number;
}

export const CameraComponent = () => {
    const { camera } = useThree();
    const cameraDataRef = useRef<CameraData | null>(null);

    listen("setCameraPosition", (data: CameraData) => {
        cameraDataRef.current = data;
    });

    useFrame(() => {
        const data = cameraDataRef.current;
        if (!data) return;

        camera.position.copy(gtaToThreeVec(data.position));

        if (data.forward && data.up) {
            const threeForward = gtaToThreeVec(data.forward).normalize();
            const threeUp = gtaToThreeVec(data.up).normalize();

            camera.up.copy(threeUp);
            camera.lookAt(
                camera.position.x + threeForward.x,
                camera.position.y + threeForward.y,
                camera.position.z + threeForward.z
            );
        }

        if (data.fov && (camera as any).isPerspectiveCamera) {
            const pCam = camera as PCam;
            if (pCam.fov !== data.fov) {
                pCam.fov = data.fov;
                pCam.updateProjectionMatrix();
            }
        }

        camera.updateMatrixWorld();
    });

    return (
        <PerspectiveCamera
            fov={65}
            near={0.01}
            far={2000}
            makeDefault
        />
    );
};
