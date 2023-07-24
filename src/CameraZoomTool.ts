import * as THREE from "three";

export default class CameraZoomTool {

    static zoomTo(target, camera, orbitControl = null) {
        // compute the box that contains all the stuff
        // from root and below
        const box = new THREE.Box3().setFromObject(target);
        CameraZoomTool.zoomToBoundary(box, camera);
        if (orbitControl?.target?.isVector3)
            box.getCenter(orbitControl.target);

    }



    static zoomToBoundary(box, camera) {
        if (box instanceof THREE.Box3) {
            const boxSize = box.getSize(new THREE.Vector3()).length();
            const boxCenter = box.getCenter(new THREE.Vector3());

            // set the camera to frame the box
            CameraZoomTool.setFitView(boxSize, boxSize, boxCenter, camera);
        }
    }

    static setFitView(sizeToFitOnScreen, boxSize, boxCenter, camera) {
        const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
        const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
        const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
        // compute a unit vector that points in the direction the camera is now
        // in the xz plane from the center of the box


        const direction = (new THREE.Vector3())
            .subVectors(new THREE.Vector3(boxSize, boxSize, boxSize), boxCenter)
            .multiply(new THREE.Vector3(1, 0, 1))
            .normalize();

        // move the camera to a position distance units way from the center
        // in whatever direction the camera was from the center already
        camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));

        // pick some near and far values for the frustum that
        // will contain the box.
        (new THREE.Vector3())
            .subVectors(new THREE.Vector3(boxSize, boxSize, boxSize), boxCenter)

        camera.near = Math.min(camera.near, camera.position.distanceTo(boxCenter));

        if (camera.far < boxSize)
            camera.far = boxSize * 2;

        camera.updateProjectionMatrix();

        // point the camera to look at the center of the box
        camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
    }
}



