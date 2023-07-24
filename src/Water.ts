import * as THREE from 'three';
import {Water as _Water} from "three/examples/jsm/objects/Water.js";

export default class Water extends THREE.Object3D {

    private static waterGeometry = new THREE.PlaneGeometry(10000, 10000);

    private static texture = new THREE.TextureLoader().load('raw/waternormals.jpg', function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    });


    private disposed: Boolean;

    constructor() {
        super();
        const w = Water.createWater();
        // @ts-ignore
        this.add(w);
    }

    static createWater() {
        const water = new _Water(
            Water.waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: Water.texture,
                sunDirection: new THREE.Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7
            }
        );
        water["rotation"].x = -Math.PI / 2;

        const scope = this;

        function animal() {
            if (!scope['disposed']) {
                requestAnimationFrame(animal);
                water.material["uniforms"] && ((water.material["uniforms"])['time'].value += 1.0 / 60.0);
            }
        }

        animal();
        return water;
    }

    clone() {
        return super.clone();
    }

    dispose() {
        super.dispose();
        this.disposed = true;
    }

}
