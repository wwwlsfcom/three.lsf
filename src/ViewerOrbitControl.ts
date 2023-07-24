import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";

export default class ViewerOrbitControl {
    private controls: OrbitControls;

    constructor(camera, canvas) {
        const controls = new OrbitControls(camera, canvas);
        // controls.enableDamping = true;
        controls.target.set(0, 0, 0);
        controls.update();
        this.controls = controls;
    }

    addChangedListener(callback) {
        this.controls.addEventListener("change", callback);
    }

    enabled(v) {
        this.controls.enabled = v;
    }

    dispose() {
        this.controls.dispose();
    }

    setTarget(target){
        this.controls.target.copy(target);
        this.controls.update();
    }
}
