/*********************
 *
 *提供了pickObject和pickPosition方法分别用来摄取对象或空间位置
 *
 ********************/


import * as THREE from 'three';
import CoordinateTransforms from "./CoordinateTransforms";


const selectableLayer = 0;
const visibleLayer = 1;

let g_transforms: CoordinateTransforms | null = null;
const g_rayCaster = new THREE.Raycaster();


let g_dom = null;
let g_camera: THREE.Camera | null = null;
let g_scene: THREE.Object3D<THREE.Event> | null = null;


class PickHelper {
    private picking_mode: any;

    private rayCaster = new THREE.Raycaster();

    constructor(camera: THREE.Camera | null, domElement: any, scene: THREE.Object3D<THREE.Event> | null) {
        g_transforms = new CoordinateTransforms(camera, domElement);
        g_dom = domElement;
        g_camera = camera;
        g_scene = scene;
        camera.layers.enable(visibleLayer);
    }

    /**
     * 选择模式： mesh - 选择单个mesh，model - 以模型为单位选取
     */
    set mode(value: any) {
        this.picking_mode = value;
    }

    /**
     * 设置捕获Line对象的精度
     */
    setLineThreshold(value: number) {
        if (g_rayCaster.params.Line)
            g_rayCaster.params.Line.threshold = value;
    }

    pickObject(pointerEvent: { clientX: any; clientY: any; }) {
        if (!g_transforms)
            return;

        const {clientX: x, clientY: y} = pointerEvent;

        const pointer = g_transforms.screenToNDC({x, y});

        const p = new THREE.Vector2(pointer.x, pointer.y);

        if (g_camera)

            g_rayCaster.setFromCamera(p, g_camera);

        const intersectedObjects = [];

        if (g_scene) {
            g_rayCaster.intersectObjects(g_scene.children, true, intersectedObjects);
        }

        const meshes = intersectedObjects.map(m => m.object).filter(mesh => mesh.visible);

        if (meshes.length > 0) {

            if (this.picking_mode === 'mesh') {
                return meshes[0];
            }

            let objects = getAncestors(meshes, g_scene);

            objects = objects?.filter(object => object.visible);

            if (objects?.length > 0)
                return objects[0];

            return getAncestor(meshes[0], g_scene);
        }

    }


    //指针在目标点击的位置
    hitTarget(object: THREE.Object3D, {clientX, clientY}): THREE.Vector3 {
        const pointer = g_transforms.screenToNDC({x: clientX, y: clientY});
        const p = new THREE.Vector2(pointer.x, pointer.y);
        this.rayCaster.setFromCamera(p, g_camera);
        const allIntersections = [];
        this.rayCaster.intersectObject(object, true, allIntersections);
        if (allIntersections.length > 0) {
            return allIntersections[0]?.point;
        }
    }

    pickPosition(pointerEvent: { clientX: any; clientY: any; }) {
        return this.hitTarget(g_scene, pointerEvent);
    }

    setSelectable(...objects) {
        objects.forEach(object => {
            object.traverse(child => {
                child.layers.enable(selectableLayer);
                child.layers.disable(visibleLayer);
            });
        });
    }

    setNoSelectable(...objects) {
        objects.forEach(object => {
            object.traverse(child => {
                child.layers.disable(selectableLayer);
                child.layers.enable(visibleLayer);
            });
        });
    }
}

function getAncestors(meshes, scene): Array<THREE.Object3D> {
    if (!scene?.isScene)
        throw  'scene is invalid.'
    if (meshes?.length > 0) {
        const objects = new Set<THREE.Object3D>();
        meshes.forEach(mesh => {
            const ancestor = getAncestor(mesh, scene);
            if (ancestor)
                objects.add(ancestor);
        });
        return Array.from(objects);
    }
}

function getAncestor(mesh, scene) {
    if (!scene?.isScene)
        throw  'scene is invalid.'
    if (mesh?.isObject3D) {
        let a = null;
        if (mesh?.parent === scene)
            return mesh;
        mesh.traverseAncestors(p => {
            if (p.parent === scene)
                a = p;
        });
        return a;
    }
}

export {PickHelper};
