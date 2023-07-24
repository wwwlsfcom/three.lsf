import * as THREE from 'three';
import Signals from 'signals';

export default class RectDrawUtil {
    private drawingFinishedEvent = new Signals();
    private drawingEvent = new Signals();

    addDrawingFinishedListener(listener: (box) => void) {
        this.drawingFinishedEvent.add(listener);
    }

    addDrawingListener(callback) {
        if (typeof callback === "function") {
            this.drawingEvent.add(callback);
        }
    }

    constructor(camera, domElement, scene) {

        camera.position.set(5, 10, -50);
        camera.lookAt(0, 0, 0);

        const line = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({color: 0xff0000}));

        let start = null;

        let drawing = false;

        const box = new THREE.Box2();

        function resetBox(box: THREE.Box2) {
            if (box) {
                box.min.x = box.min.y = Infinity
                box.max.x = box.max.y = -Infinity
            }
        }

        function updateBox(box: THREE.Box2, ndc: THREE.Vector2) {
            box.min.min(ndc);
            box.max.max(ndc);
        }

        function drawLine(start: THREE.Vector2, end: THREE.Vector2) {
            line.geometry.dispose();
            const geometry = new THREE.BufferGeometry();

            const points = [new THREE.Vector3(start.x, start.y, 0),
                new THREE.Vector3(start.x, end.y, 0),
                new THREE.Vector3(end.x, end.y, 0),
                new THREE.Vector3(end.x, start.y, 0)];

            points.forEach(p => p.unproject(camera));

            const vertices = [];
            points.forEach(p => vertices.push(p.x, p.y, p.z));

            geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
            line.geometry = geometry;
        }

        function cssToNDC(clientX, clientY, dom): THREE.Vector2 {

            const rect = dom.getBoundingClientRect();

            const vec2 = new THREE.Vector2();

            vec2.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            vec2.y = ((clientY - rect.top) / rect.height) * -2 + 1;  // note we flip Y

            return vec2;
        }

        domElement.addEventListener('pointerdown', e => {
            if (!this.enabled) return;
            resetBox(box);
            drawing = true;
            start = cssToNDC(e.clientX, e.clientY, domElement);
            updateBox(box, start);
        });

        domElement.addEventListener('pointerup', e => {
            if (!this.enabled) return;

            if (drawing) {
                const end = cssToNDC(e.clientX, e.clientY, domElement);
                updateBox(box, end);
                this.drawingFinishedEvent.dispatch({box, hasCtrl: e.ctrlKey });
                drawing = false;
                scene.remove(line);
                line.geometry.dispose();
            }
        });

        domElement.addEventListener('pointermove', e => {
            if (!this.enabled) {
                drawing = false;
                return;
            }
            if (!drawing) return;

            const end = cssToNDC(e.clientX, e.clientY, domElement);

            drawLine(start, end);
            scene.add(line);

            this.drawingEvent.dispatch();
        });
    }

    private _enabled = false;

    get enabled(): boolean {
        return this._enabled;
    }

    set enabled(value: boolean) {
        this._enabled = value;
    }


}
