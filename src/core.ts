import * as THREE from 'three';

export function enableShadow(object, shadowOptions) {
    if (shadowOptions && (shadowOptions.hasOwnProperty('receiveShadow') || shadowOptions.hasOwnProperty('castShadow'))) {
        object?.traverse && object.traverse(c => {
            if (c.isMesh) {
                if (shadowOptions.hasOwnProperty('receiveShadow')) {
                    c.receiveShadow = shadowOptions['receiveShadow'];
                }
                if (shadowOptions.hasOwnProperty('castShadow')) {
                    c.castShadow = shadowOptions['castShadow'];
                }
            }
        });
    }
}


/**
 * 组合对象
 */
export function compose(...objects: THREE.Object3D[]) {
    if (objects.length > 0) {
        const group = new THREE.Group();
        const boundary = new  THREE.Box3();
        const box = new  THREE.Box3();
        objects.forEach(object => {
            boundary.union(box.setFromObject(object));
        });
        // @ts-ignore
        boundary.getCenter(group.position);

        group.updateMatrixWorld(true);
        const groupMatrixInverting = new THREE.Matrix4().copy(group.matrix).invert();

        group.add(...objects);
        objects.forEach(object => {
            object.applyMatrix4(groupMatrixInverting);
        });

        return group;
    }
}

export function decompose(group) {
    if (group?.isGroup && group.children?.length > 1) {
        const objects = [...group.children];
        objects.forEach(c => {
            c.applyMatrix4(group.matrix);
        });
        group.clear();
        return objects;
    }
}



export function radToDegXYZ({x, y, z}) {
    return {
        x: THREE.MathUtils.radToDeg(x),
        y: THREE.MathUtils.radToDeg(y),
        z: THREE.MathUtils.radToDeg(z),
    }
}


export function resizeDirectionalLightShadowCamera(light: THREE.DirectionalLight, sphere: THREE.Sphere, position: THREE.Vector3 = null) {
    let isValidParams = light?.isDirectionalLight === true;
    isValidParams &&= sphere?.center?.isVector3 === true && sphere.radius > 0;

    if (!isValidParams)
        throw "参数无效";

    light.target.position.copy(sphere.center);

    if (position?.isVector3 === true)
        light.position.copy(position);
    else {
        light.position.copy(sphere.center).y += sphere.radius;
    }

    const shadowCamera = light.shadow.camera;
    shadowCamera.left = shadowCamera.bottom = -sphere.radius;
    shadowCamera.right = shadowCamera.top = sphere.radius;
    shadowCamera.far = 4 * sphere.radius;
}
