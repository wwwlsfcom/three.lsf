/**
 *  用来设置或恢复对象外观的辅助工具对象
 */
import * as THREE from "three";

import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {OutlinePass} from 'three/examples/jsm/postprocessing/OutlinePass.js';
import {FXAAShader} from 'three/examples/jsm/shaders/FXAAShader.js';


export default class ObjectHighLightHelper {

    private highlightUtil: IObject3DHighlightable;

    constructor(renderer, scene, camera, sceneHelper) {
        this.highlightUtil = new EffectComposerHighLight(renderer, scene, camera, sceneHelper);
        // this.highlightUtil = new Object3DBoundaryHighlight(sceneHelper);
    }

    setHighLightObject(obj) {
        this.highlightUtil.setHighLightObject(obj);
    }

    cancelHighLight(obj) {
        this.highlightUtil.cancelHighLight(obj);
    }

    render(){
        this.highlightUtil.update();
    }

}


interface IObject3DHighlightable {
    setHighLightObject(object);

    cancelHighLight(object);

    update();
}

class EffectComposerHighLight implements IObject3DHighlightable {

    private outlinePass: OutlinePass;
    private selectedObjects = new Set<THREE.Object3D>()
    private composer: any;


    constructor(renderer, scene, camera, sceneHelper) {
        let effectFXAA, outlinePass;

        const dom = renderer.domElement;
        renderer.autoClear = false;

        const mainRenderPass = new RenderPass(scene, camera);
        mainRenderPass.renderToScreen = false
        mainRenderPass.clear = true
        mainRenderPass.clearDepth = true

        const secondaryRenderPass = new RenderPass(sceneHelper, camera)
        secondaryRenderPass.renderToScreen = false
        secondaryRenderPass.clear = false
        secondaryRenderPass.clearDepth = true

        const composer = new EffectComposer(renderer);

        composer.addPass(mainRenderPass);
        composer.addPass(secondaryRenderPass);

        outlinePass = new OutlinePass(new THREE.Vector2(dom.clientWidth, dom.clientHeight), scene, camera);

        outlinePass.visibleEdgeColor.set(0x0000FF);

        composer.addPass(outlinePass);

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('raw/tri_pattern.jpg', function (texture) {

            outlinePass.patternTexture = texture;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;

        });

        effectFXAA = new ShaderPass(FXAAShader);
        effectFXAA.uniforms['resolution'].value.set(1 / dom.clientWidth, 1 / dom.clientHeight);
        composer.addPass(effectFXAA);

        this.outlinePass = outlinePass;

        this.composer = composer;

    }

    update() {
        this.composer.render();
    }

    updateOutlinePass() {
        this.outlinePass.selectedObjects = Array.from(this.selectedObjects);
    }


    cancelHighLight(object) {
        if (this.selectedObjects.has(object)) {
            this.selectedObjects.delete(object);
            this.updateOutlinePass();
        }
    }

    setHighLightObject(object) {
        if (this.selectedObjects.has(object))
            return;
        this.selectedObjects.add(object);
        this.updateOutlinePass();
    }

}

class Object3DBoundaryHighlight implements IObject3DHighlightable {
    private boxHelpers = new Map<THREE.Object3D, THREE.Box3Helper>();
    private scene: THREE.Scene;

    constructor(scene) {
        this.scene = scene;

        const scope = this;

        function animal() {
            const helpersCache = new Map(Array.from(scope.boxHelpers));
            helpersCache.forEach((helper, object) => {
                if (!object.visible || !object.parent) {
                    scope.cancelHighLight(object);
                } else {
                    helper.box.setFromObject(object);
                }
            });
            requestAnimationFrame(animal);
        }

        animal();
    }

    cancelHighLight(object) {
        if (this.boxHelpers.has(object)) {
            const boxHelper = this.boxHelpers.get(object);
            this.scene.remove(boxHelper);
            this.boxHelpers.delete(object);
        }
    }

    setHighLightObject(object) {
        const box = new THREE.Box3();
        const boxHelper = new THREE.Box3Helper(box);
        box.setFromObject(object);
        this.scene.add(boxHelper);
        this.boxHelpers.set(object, boxHelper);
    }

    update() {
    }
}
