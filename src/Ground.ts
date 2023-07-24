import * as THREE from "three";


export class Ground extends THREE.Mesh {


    constructor(width, height, img, repeatX, repeatY) {

        const geometry = Ground.createGeometry({width, height});
        const material = Ground.createMaterial({repeatX, repeatY, img});

        super(geometry, material);

        this['receiveShadow'] = true;

        this['castShadow'] = false;

        this['rotation'].x = THREE.MathUtils.degToRad(-90);


    }

    static createMaterial({repeatX, repeatY, img}) {
        // load a texture, set wrap mode to repeat
        const texture = new THREE.TextureLoader().load(img);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);

        return new THREE.MeshStandardMaterial({map: texture, side: THREE.DoubleSide});
    }

    static createGeometry({width, height}) {
        return new THREE.PlaneGeometry(width, height);
    }

}
