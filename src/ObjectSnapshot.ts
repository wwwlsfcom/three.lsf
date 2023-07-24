import CameraZoomTool from "./CameraZoomTool";
import * as THREE from 'three';
import Queue from "../Queue";


const createObjectSnapshot = (function () {

    const objects = new Queue();
    let renderer, scene, camera;

    function generateObjectSnapshot() {

        if (!renderer) {
            renderer = new THREE.WebGLRenderer();
            scene = new THREE.Scene();
            scene.background = new THREE.Color().set(0xAAAAAA);
            scene.add(new THREE.AmbientLight(0xffffff, 1));
            camera = new THREE.PerspectiveCamera(75, 1, .1, 10000);
        }

        if (!objects.isEmpty()) {
            const {resolve, object, imageWidth, imageHeight} = objects.dequeue();

            renderer.setSize(imageWidth, imageHeight, true);

            camera.aspect = imageWidth / imageHeight;
            scene.add(object);
            CameraZoomTool.zoomTo(object, camera);

            renderer.render(scene, camera);

            const canvas = renderer.domElement;
            const imgData = canvas.toDataURL('image/jpeg');

            scene.remove(object);

            resolve(imgData);
        }
    }

    return function (object, {imageWidth = 64, imageHeight = 64} = {}): Promise<string> {
        return new Promise(resolve => {
            objects.enqueue({resolve, object, imageWidth, imageHeight});
            requestAnimationFrame(generateObjectSnapshot);
        });
    }

})();


export default createObjectSnapshot;
