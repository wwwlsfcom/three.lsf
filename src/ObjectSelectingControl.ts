import ObjectPickSelector from "./ObjectPickSelector";
import ObjectBoxSelector from "./ObjectBoxSelector";
import ObjectHighLightHelper from "./ObjectHighLightHelper";
import Signals from 'signals';

import * as THREE from 'three';
import ObjectSelector from "./ObjectSelector";

export default class ObjectSelectingControl {
    private readonly pickSelector: ObjectPickSelector;
    private readonly boxSelector: ObjectBoxSelector;

    private selectionChanged = new Signals();

    private readonly highLightHelper: ObjectHighLightHelper;

    private _selection = new Array<THREE.Object3D>();

    constructor(camera, canvas, renderer) {
        this.pickSelector = new ObjectPickSelector(camera, canvas, renderer.scene);

        this.boxSelector = new ObjectBoxSelector(camera, canvas, renderer.scene, renderer.sceneHelper);
        this.setupSelectingListener([this.pickSelector, this.boxSelector]);

        this.highLightHelper = new ObjectHighLightHelper(renderer.webGLRenderer, renderer.scene, camera, renderer.sceneHelper);
    }

    public render(){
        this.highLightHelper.render();
    }

    setPickingMode(v) {
        this.pickSelector.setPickingMode(v)
    }

    addSelectionChangedListener(listener: ({added, removed}) => void) {
        this.selectionChanged.add(listener);
    }

    addSelectingBoxChanged(listener) {
        this.boxSelector.addSelectingBoxChanged(listener);
    }

    set pickSelectingEnabled(v: boolean) {
        this.pickSelector.setEnabled(v);
    }

    set boxSelectingEnabled(v: boolean) {
        this.boxSelector.setEnabled(v);
    }

    get selection(): Array<any> {
        return this._selection;
    }


    private readonly excludes = new Set();

    private setupSelectingListener(param: ObjectSelector[]) {
        param.forEach(selector => this.setupSelectorListener(selector));
    }

    private setupSelectorListener(selector: ObjectSelector) {
        selector.addSelectionChangedListener(({added, removed}) => {
            const addedObjects = added.filter(obj => !this.excludes.has(obj));

            addedObjects?.forEach(obj => this.highLightHelper.setHighLightObject(obj));
            removed?.forEach(obj => this.highLightHelper.cancelHighLight(obj));
            this.selectionChanged.dispatch({addedObjects, removed});

            this.updateSelection({added: addedObjects, removed});
        });
    }

    addObjectActiveListener(listener: (object3d) => void) {
        this.pickSelector.addSelectionChangedListener(({added}) => {
            if (typeof listener === 'function')
                if (added?.length > 0)
                    listener(added[0]);
                else
                    listener(null);
        });
    }

    setSelectable(...objects: THREE.Object3D[]) {
        this.pickSelector.setSelectable(...objects);
        this.boxSelector.setSelectable(...objects);
    }

    disableSelectable(...objects: THREE.Object3D[]) {
        this.pickSelector.disableSelectable(...objects);
        this.boxSelector.disableSelectable(...objects);
    }


    private updateSelection(param: { removed: Array<THREE.Object3D>; added: Array<THREE.Object3D> }) {
        const {removed, added} = param;
        if (removed?.length > 0) {
            removed.forEach(o => {
                let i = -1;
                if ((i = this._selection.indexOf(o)) > -1)
                    this._selection.splice(i, 1);
            });
        }

        if (added?.length > 0) {
            added.forEach(o => {
                let i = 0;
                if (!this._selection.includes(o))
                    this._selection.push(o);
            });
        }

    }
}
