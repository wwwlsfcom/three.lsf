import * as THREE from 'three';


/**
 * 旋转中心对齐几何体中心的对象
 */
export default class PivotedObject3D {

    private object;
    private pivot: string;


   protected constructor() {

    }

    isPivoted() {
        return true;
    }

    /**
     *
     * @param object
     * @param pivot: 坐标原点(0,0,0)在模型几何的位置, center(默认值) - 几何中心,   'bottom': 下表面中心
     */
   static pivoting(object, pivot = "center") {

        const g = new THREE.Group();

        g.add(object);
        const box = new THREE.Box3().setFromObject(g);
        const center = box.getCenter(new THREE.Vector3());
        if (pivot === 'bottom') {
            center.setY(box.min.y)
        }


       object.position.copy(center.multiplyScalar(-1));

        return g;

    }


}
