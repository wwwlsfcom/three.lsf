import ObjectSelector from "./ObjectSelector";
import * as THREE from 'three';
import RectDrawUtil from "./RectDrawUtil";

export default class ObjectBoxSelector extends ObjectSelector {


    private reactDrawUtil: RectDrawUtil;
    private readonly scene: THREE.Scene;

    private readonly excludedObjects = new Set<THREE.Object3D>();

    constructor(camera, canvas, scene, sceneHelper) {
        super();
        this.reactDrawUtil = new RectDrawUtil(camera, canvas, sceneHelper);

        this.scene = scene;

        const boundary = new THREE.Box3();
        const point1 = new THREE.Vector2();
        const point2 = new THREE.Vector2();

        function containMesh(box, mesh, camera) {
            boundary.setFromObject(mesh);
            boundary.min.project(camera);
            boundary.max.project(camera);
            point1.set(boundary.min.x, boundary.min.y);
            point2.set(boundary.max.x, boundary.max.y);
            return box.containsPoint(point1) && box.containsPoint(point2);
        }


        function getSelectableObjects(objects, excludedObjects) {
            const box = new THREE.Box3();
            const v = new THREE.Vector3();

            function noZeroSize(object) {
                return box.setFromObject(object).getSize(v).length() > 0
            }

            const scope = this;

            function isSelectable(obj) {
                let selectable = obj.visible;
                selectable &&= !obj.isLight;
                selectable &&= !obj.isCamera;
                selectable &&= noZeroSize(obj)
                selectable &&= !excludedObjects.has(obj);
                return selectable;
            }

            return objects?.filter(isSelectable.bind(scope));
        }

        this.reactDrawUtil.addDrawingFinishedListener(({box, hasCtrl}) => {

            const added = [];
            const removed = [];

            getSelectableObjects(this.scene.children, this.excludedObjects)?.forEach(object => {
                if (containMesh(box, object, camera)) {
                    if (!this.isSelected(object)) {
                        this.selectObject(object)
                        added.push(object);
                    }
                } else if (!hasCtrl && this.isSelected(object)) {
                    this.cancelSelectingObject(object);
                    removed.push(object);
                }
            });

            this.getSelection().forEach(object => {
                if (!hasCtrl && !containMesh(box, object, camera)) {
                    this.cancelSelectingObject(object);
                    removed.push(object);
                }
            })

            if (added.length > 0 || removed.length > 0)
                this.selectionChanged.dispatch({added, removed});
        });

    }


    addSelectingBoxChanged(listener) {
        this.reactDrawUtil.addDrawingListener(listener);
    }


    setEnabled(v) {
        this.reactDrawUtil.enabled = v;
    }

    setSelectable(...obj) {
        obj?.forEach(object => {
            this.excludedObjects.delete(object);
            this.setSelectable(...object.children);
        });
    }

    disableSelectable(...obj) {
        obj?.forEach(object => {
            this.excludedObjects.add(object);
        });
    }


}
