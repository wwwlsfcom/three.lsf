import * as THREE from 'three';
import {TransformControls} from "three/examples/jsm/controls/TransformControls.js";
import {PointerLockControls} from "three/examples/jsm/controls/PointerLockControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

import Signals from 'signals';

import Renderer from "./Renderer";
import ViewerOrbitControl from "./ViewerOrbitControl";
import ObjectSelectingControl from "./ObjectSelectingControl";
import CameraZoomTool from "./CameraZoomTool";


export default class Viewer {
    private readonly renderer: Renderer;
    private viewerOrbitCtrl: ViewerOrbitControl;

    private objectSelectingControl: ObjectSelectingControl;
    private readonly transformControl: TransformControls;
    private readonly lockControls: PointerLockControls;
    private readonly scene: THREE.Scene;
    private readonly camera: THREE.PerspectiveCamera;
    private canvas: any;
    transformControlStarted = new Signals();
    transformControlEnded = new Signals();

    private gridHelper = new THREE.GridHelper(100, 100);
    private axesHelper = new THREE.AxesHelper();

    private sceneHelper;

    constructor(viewerContainer, config = null) {
        const renderer = new Renderer(viewerContainer);
        const scene = renderer.scene;
        const camera = renderer.camera;
        const canvas = renderer.canvas;
        const sceneHelper = renderer.sceneHelper;

        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.canvas = canvas;
        this.sceneHelper = sceneHelper;

        const noStats = config?.stats === false;
        if (!noStats)
            this.setupStats(viewerContainer);

        const updateView = this.update.bind(this);

        this.viewerOrbitCtrl = new ViewerOrbitControl(camera, canvas);
        this.viewerOrbitCtrl.addChangedListener(updateView);

        this.lockControls = this.setupLockControls(camera, scene, this);

        const button = this.setupFirstPersonButton(viewerContainer);

        this.objectSelectingControl = new ObjectSelectingControl(camera, canvas, renderer);

        this.transformControl = new TransformControls(camera, canvas);
        sceneHelper.add(this.transformControl);

        this.transformControl.addEventListener('mouseDown', () => {
            this.transformControlStarted.dispatch(null);
        });

        this.transformControl.addEventListener('mouseUp', () => {
            this.transformControlEnded.dispatch(null);
        });

        this.transformControl.addEventListener("change", updateView);

        this.objectSelectingControl.addSelectingBoxChanged(updateView);
        this.objectSelectingControl.addSelectionChangedListener(updateView);

        // const self = this;
        //
        // function animal() {
        //     self.objectSelectingControl.render();
        //     requestAnimationFrame(animal);
        // }
        //
        // animal();
    }

    set transformMode(v) {
        this.transformControl.setMode(v);
    }

    set showGrid(visible) {
        this.gridHelper.visible = visible;
        this.axesHelper.visible = visible;
    }

    set orbitControlsEnabled(v) {
        this.viewerOrbitCtrl.enabled(v);
    }


    setTransformTarget(object) {
        if (object?.isObject3D)
            this.transformControl.attach(object);
        else
            this.transformControl.detach();
    }

    addObjectActiveListener(listener: (object3d) => void) {
        this.objectSelectingControl.addObjectActiveListener(listener);
    }

    dispose() {
        this.objectSelectingControl.pickSelectingEnabled = false;
        this.objectSelectingControl.boxSelectingEnabled = false;
        this.viewerOrbitCtrl.dispose();
        this.renderer.dispose();
    }

    private setupStats(container) {
        const stats = new Stats();
        container.appendChild(stats.dom);
        stats.dom.style.top = 'unset';
        stats.dom.style.bottom = "0";
        stats.dom.style.position = 'absolute';

        if (container.style.position !== 'absolute') {
            container.style.position = 'relative';
        }

        function animation() {
            stats.update();
            requestAnimationFrame(animation);
        }

        animation();
    }

    addObjectTransformingListener(listener: (object3d) => void) {
        this.transformControl.addEventListener('dragging-changed', () => {
            listener(this.transformControl.object);
        });
    }

    getCurrentSelection() {
        return this.objectSelectingControl.selection;
    }

    addObject3D(...object3DS: THREE.Object3D[]) {
        this.scene.add(...object3DS);
    }

    enableBoxSelecting(enabled: boolean) {
        this.objectSelectingControl.boxSelectingEnabled = enabled;
    }

    enablePickSelecting(enabled: boolean) {
        this.objectSelectingControl.pickSelectingEnabled = enabled;
    }

    removeObjects(...object3DS: THREE.Object3D[]) {
        if (object3DS?.includes(this.transformControl.object))
            this.transformControl.detach();
        this.scene.remove(...object3DS);
    }

    zoomTo(...object: THREE.Object3D[]) {
        if (object?.length > 0) {
            const box = new THREE.Box3();
            const boundary = new THREE.Box3();
            object.forEach(obj => {
                if (obj?.isObject3D) {
                    boundary.union(box.setFromObject(obj));
                }
            });
            CameraZoomTool.zoomToBoundary(boundary, this.camera);
            const center = new THREE.Vector3();
            boundary.getCenter(center);
            this.viewerOrbitCtrl.setTarget(center);
        }
    }

    setSelectable(...object3DS: THREE.Object3D[]) {
        this.objectSelectingControl.setSelectable(...object3DS);
    }

    disableSelectable(...object3DS: THREE.Object3D[]) {
        this.objectSelectingControl.disableSelectable(...object3DS);
    }


    setBackground(v: string) {
        // this.scene.background = new THREE.Color().set(v);
    }

    setFog(fog: { color: string; density: number }) {
        if (fog) {
            const {color, density} = fog;
            if (this.scene.fog) {
                if (color !== undefined)
                    this.scene.fog.color.set(color);
                if (density !== undefined)
                    (this.scene.fog as THREE.FogExp2).density = density;
            } else {
                this.scene.fog = new THREE.FogExp2(color, density);
            }
        } else {
            this.scene.fog = null;
        }
    }

    getCamera() {
        return this.camera;
    }

    update() {
        // this.renderer.requestRender();
        this.objectSelectingControl?.render();
    }

    private setupLockControls(camera, scene, viewer) {
        const controls = new PointerLockControls(camera, document.body);
        scene.add(controls.getObject());

        let moveForward = false;
        let moveBackward = false;
        let moveLeft = false;
        let moveRight = false;
        let canJump = false;

        const raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);

        const onKeyDown = function (event) {

            switch (event.code) {

                case 'ArrowUp':
                case 'KeyW':
                    moveForward = true;
                    break;

                case 'ArrowLeft':
                case 'KeyA':
                    moveLeft = true;
                    break;

                case 'ArrowDown':
                case 'KeyS':
                    moveBackward = true;
                    break;

                case 'ArrowRight':
                case 'KeyD':
                    moveRight = true;
                    break;

                case 'Space':
                    if (canJump === true) velocity.y += 350;
                    canJump = false;
                    break;

            }

        };

        const onKeyUp = function (event) {

            switch (event.code) {

                case 'ArrowUp':
                case 'KeyW':
                    moveForward = false;
                    break;

                case 'ArrowLeft':
                case 'KeyA':
                    moveLeft = false;
                    break;

                case 'ArrowDown':
                case 'KeyS':
                    moveBackward = false;
                    break;

                case 'ArrowRight':
                case 'KeyD':
                    moveRight = false;
                    break;

            }

        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        let prevTime = performance.now();
        const velocity = new THREE.Vector3();
        const direction = new THREE.Vector3();

        const objects = [];

        function animate() {
            const time = performance.now();

            if (controls.isLocked === true) {

                raycaster.ray.origin.copy(controls.getObject().position);
                raycaster.ray.origin.y -= 10;

                const intersections = raycaster.intersectObjects(objects, false);

                const onObject = intersections.length > 0;

                const delta = (time - prevTime) / 1000;

                velocity.x -= velocity.x * 10.0 * delta;
                velocity.z -= velocity.z * 10.0 * delta;

                velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

                direction.z = Number(moveForward) - Number(moveBackward);
                direction.x = Number(moveRight) - Number(moveLeft);
                direction.normalize(); // this ensures consistent movements in all directions

                if (moveForward || moveBackward) velocity.z -= direction.z * 100.0 * delta;
                if (moveLeft || moveRight) velocity.x -= direction.x * 100.0 * delta;

                if (onObject === true) {
                    velocity.y = Math.max(0, velocity.y);
                    canJump = true;
                }

                controls.moveRight(-velocity.x * delta);
                controls.moveForward(-velocity.z * delta);

                controls.getObject().position.y += (velocity.y * delta); // new behavior

                if (controls.getObject().position.y < 10) {
                    velocity.y = 0;
                    controls.getObject().position.y = 10;
                    canJump = true;
                }
            }

            prevTime = time;
            viewer.update();
            requestAnimationFrame(animate)
        }

        animate();
        return controls;
    }

    private setupFirstPersonButton(viewerContainer) {
        const button = document.createElement("button");
        button.classList.add("button");

        button.title = '切换第一人称模式';

        const img = document.createElement("img");
        img.style.width = '1.5em';
        img.src = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAAAXNSR0IArs4c6QAABIRJREFUSEvtlmuIVGUYx///d3Zs1/WWkpkYZBHZnpldypXSnTOyhTRzJrvClGCpFGEUkkFIF6RQUEIUoSD9oHb5YPslrJ2Z3SR058yuIku5zjkmSqLdlITwhrvuzJwn3nFm2GQvY/qx99M58Lz/3/u+z5W4gZU8eGIScoNbAIkD9EHwrc+XX/VES9Nf1cqwWkNtl7SdJICoAH0EagAYAHoPhYxHPiS9arSqBrbbR+5VUL9A+HXUbFiixVMZdw+AxQTNqGlkbi2wK7tAKXaD8o4VCm4qAm3nAwHWifCZWNjQ8DFX1Tfct8+d0F8jZwCcp3C5pzxF4ecApyOfv8dqbfp9TBqAqoElH74MYCcAVREfcuNbDtSCHbbT5BHPAawhC+3RlsYD1YDKNlXfcM/B7J3+QRUXJbMprNxQIJcU5IeoGdxfDbgqYEc6G/PI3QAmjCRKsO2Ouv6lzc3NudHAYwI7u7J3FxSPAfAAbgW8kxRVyTmP3mQFxgVYAME6KxxYe1PApJ19H+B6CNZY4cDHw4ntyRyb6Jf8OYAXLdOYflPARMbZScFyCiLRcKBzJLGk7R4D5AH/wMCURYuaL4z89GN4Opl2doFYRkjraIGRsJ3DBJqu5nO3P9v60Pn/gSM+bMJ2txKyCmAXRE55PrXpyZYGp7whYTsbKLgLxPMAai9PZX3cMAb/85Om0tlGIXsB+LWIABtjZuBd/V0sBjmeLYsLZFvMDK68qSjVmzt7jszx8ioqxGYAX1hmYFmlzAGHIfieip9e+tNNxOPxwg0DO3rcqch78wtKNSKHnbFW42xbT0/dhMKkK5pvmYGIFk3YboSQlJDvxULGhr17eyfn6upeAr3jOfEfeDo059L18Eql0ZBCQXS+vQhiXuWZKK/HQsHPSt1C59cpyww06f9Uxlkmgl2AvGKZwR0J211ByI7SXg+QQwLsHjdwdVc5N4vAZMZ9E4L1gEwuGbsEdDHurs3Xf9PaOnvgGrCY3FMsMzCjdIA1ADaCtKyQkfqut3d8zcBtSzzBPIKPAbi/pHeewJqoGdjOZNpdC8pHAAYg/KQg3L54YcOJ4fyQtN39gIQvnznq175KZJzNFKxWouZGwg0/Xr+nvSv7IJVaSYgOpHG6PDJpO5eLhVn4qBU2jo7m8GTa3Q3KC2RhTqSl8Xgq4yb0UKVEzYyEG/Q0MOwq9lBAzzx5DdR+0Q3OjJiBvlGBGectCLYA0C3oaqld/XooZMwebWprt4/MVVBdAK8wlXZWl8I9J5Ad9NQ2a6Hx03BgEWFH99HXxPOeAlU9BD+LjxtjLQ2nh7NPdTvzxMOrAFboPCbwRjFoUml3uUA2gZhW2ngagv1Q7KV4Tg7q5My6/jMjNdc21x1X+zdmKMp9PpGgCB8G8TiAWdf0eI7ivR0NB7+qpEU5wkS4FEBLubL8++S8AMjF0pP6rg1TnDQkuoeaD4LI0OOX+fH9bYubm3UODz+1dXb21ct4/3wP0iSUAERmAZxFcBogtQAmlk6uD6D9eU4gfxD4jcKsCPsK9f0Hy5Chp/gHgR0GKY1GHRMAAAAASUVORK5CYII=`;

        button.append(img);
        viewerContainer.append(button);

        Object.assign(button.style, {
            position: 'absolute',
            top: '1em',
            right: '1em',
            zIndex: '10',
            padding: '.25em',
            backgroundColor: 'black'
        });

        let isLocked = false;

        button.addEventListener("click", () => {
            if (!isLocked) {
                if (!this.lockControls.isLocked) {
                    this.lockControls.lock();
                    this.orbitControlsEnabled = false;
                }
            } else {
                if (this.lockControls.isLocked) {
                    this.lockControls.unlock();
                    this.orbitControlsEnabled = true;
                }
            }
            isLocked = !isLocked;
        });

        this.lockControls.addEventListener("unlock", () => {
            this.orbitControlsEnabled = true;
            isLocked = false;
        })

    }

    showSky() {
        this.renderer.setSky();
    }

    setPickingMode(v) {
        this.objectSelectingControl.setPickingMode(v);
    }

    setColorSpace(v) {
        this.renderer.setColorSpace(v);
        this.scene.traverse(c => {
            if ((c as THREE.Mesh).isMesh) {
                const m = (c as THREE.Mesh).material;
                if (m instanceof Array) {
                    m.forEach(mm => mm.needsUpdate = true)
                } else {
                    m.needsUpdate = true;
                }

            }
        })
        this.update();
    }


    updateToneMapping(v) {
        this.renderer.updateToneMapping(v);
    }
}
