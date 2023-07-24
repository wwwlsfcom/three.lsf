import ObjectSelector from "./ObjectSelector";
import * as THREE from 'three';
import {identicalSet} from "../utils";
import {PickHelper} from "./PickHelper";


/**
 * 指针点选对象工具
 */
export default class ObjectPickSelector extends ObjectSelector {

    private pickHelper: PickHelper;


    private _dom;
    private _objectsFSM;
    private _enabled;

    private _pickedObject: THREE.Object3D;

    constructor(camera, domElement, scene) {
        super();

        this.pickHelper = new PickHelper(camera, domElement, scene);


        this._dom = domElement;


        this._objectsFSM = new Map();

        this._dom.addEventListener('pointerdown', this.onMouseDown.bind(this));
        this._dom.addEventListener('pointerup', this.onMouseUp.bind(this));
    }

    reset() {
        super.reset();
        this._objectsFSM.clear();
    }

    setPickingMode(v){
        this.pickHelper.mode = v;
    }

    setEnabled(v) {
        this._enabled = v;
    }

    setSelectable(...obj) {
        this.pickHelper.setSelectable(...obj);
    }

    disableSelectable(...obj) {
        this.pickHelper.setNoSelectable(...obj);
    }

    private onMouseDown(event) {
        if (!this._enabled) return;
        this.savePickedObject(event);
    }

    private onMouseUp(event) {
        if (!this._enabled) return;

        if (!this.testPickedObject(event)) {
            return;
        }

        const oldSelection = new Set([...this.getSelection()]);

        const fsm = this.createObjectFSM(this._pickedObject);

        this.updateFsmByCtrlPressed(fsm, event);

        this.deleteNotSelectedFsm();


        const {part1, part2} = identicalSet(oldSelection, this.getSelection())
        this.selectionChanged.dispatch({added: Array.from(part2), removed: Array.from(part1)});

    }

    private testPickedObject(event) {
        let obj = this.pickHelper.pickObject(event);
        return this._pickedObject === obj;
    }


    private savePickedObject(event) {
        this._pickedObject = this.pickHelper.pickObject(event)
    }



    private createObjectFSM(obj: THREE.Object3D) {
        let fsm = this._objectsFSM.get(obj);
        const scope = this;
        if (!fsm && obj) {
            fsm = new Fsm(obj, {
                selectObject(object) {
                    scope.selectObject(object);
                },
                cancelSelectingTarget(object) {
                    scope.cancelSelectingObject(object);
                }
            });
            this._objectsFSM.set(obj, fsm);
        }
        return fsm;
    }

    private updateFsmByCtrlPressed(fsm: any, event) {
        const isCtrlHit = event.ctrlKey;
        fsm?.hit(isCtrlHit);

        this._objectsFSM.forEach(f => {
            if (f !== fsm) {
                f.notHit(isCtrlHit);
            }
        });
    }

    private deleteNotSelectedFsm() {

        this._objectsFSM.forEach((v, k) => {
            if (!v.isSelected) {
                this._objectsFSM.delete(k);
            }
        });

    }



}


class Fsm {
    private _state: number;
    private _control: any;
    private readonly _object: any;

    constructor(object, selectingControl: { selectObject, cancelSelectingTarget }) {
        this._object = object;
        this._state = 0x00;
        this._control = selectingControl;
    }

    hit(isCtrl) {
        if (isCtrl) {
            if (this.isSelected) {
                this.cancelSelecting();
            } else {
                this.selecting();
            }
        } else {
            this.selecting();
        }
    }


    notHit(isCtrl) {
        if (!isCtrl && this.isSelected) {
            this.cancelSelecting();
        }
    }

    get isSelected() {
        return this._state === 0x01;
    }

    selecting() {
        this._control.selectObject(this._object);
        this._state = 0x01;
    }

    cancelSelecting() {
        this._control.cancelSelectingTarget(this._object);
        this._state = 0x02;
    }
}
