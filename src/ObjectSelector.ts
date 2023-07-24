/**
 * 对象 指针选择器
 */
import * as THREE from 'three';
import Signals from 'signals';

export default abstract class ObjectSelector {
    protected selectionChanged = new Signals(); // 选择改变事件

    private _selection = new Array<THREE.Object3D>();

    protected constructor() {
    }

    addSelectionChangedListener(listener: (event: {
        added: Array<THREE.Object3D>  // 新选中的对象
        removed: Array<THREE.Object3D>  // 被取消选中的对象
    }) => void) {
        this.selectionChanged.add(listener);
    }

    abstract setSelectable(...obj);

    abstract setEnabled(v);

    reset() {
        this._selection.splice(0);
    }

    getSelection(): Array<THREE.Object3D> {
        return [...this._selection];
    }

    protected selectObject(obj) {
        if (!this._selection.includes(obj))
            this._selection.push(obj);
    }

    protected isSelected(obj) {
        return this._selection.includes(obj);
    }


    protected cancelSelectingObject(obj) {
        let i = -1;
        if ((i = this._selection.indexOf(obj)) > -1)
            this._selection.splice(i, 1);
    }

}
