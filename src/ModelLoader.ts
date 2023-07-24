/**
 * 简化 文件 模型的加载过程
 */
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader.js";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader.js";

import * as THREE from 'three';
import {computeBoundsTree, disposeBoundsTree, acceleratedRaycast} from 'three-mesh-bvh';
// Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('raw/draco/')
dracoLoader.setDecoderConfig({type: 'js'});

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const fbxLoader = new FBXLoader();

export default class ModelLoader {


    /**
     * @return Promise<THREE.Object3D>
     */
    static async fromGLTF(url): Promise<THREE.Object3D> {


        return new Promise(resolve => {
            gltfLoader.load(url, gltf => {
                ModelLoader.computeBoundsTree(gltf.scene);
                resolve(gltf.scene);
            });
        });
    }

    static computeBoundsTree(object) {
        object?.traverse(c => {
            if ((c as THREE.Mesh).isMesh) {
                (c as THREE.Mesh).geometry.computeBoundsTree();
            }
        })
    }

    static async fromGLB(url): Promise<THREE.Object3D> {
        return new Promise(resolve => {
            gltfLoader.load(url, function (gltf) {
                resolve(gltf.scene);
            });
        });
    }

    static async fromGLTFs(urls) {
        return Promise.all(urls.map(url => ModelLoader.fromGLTF(url)))
    }

    static async fromFbx(fbxUrl, onProgress = null): Promise<THREE.Object3D> {

        const group = await fbxLoader.loadAsync(fbxUrl);

        return group;
    }


    static async fromURL(url): Promise<THREE.Object3D> {
        if (url.toLowerCase().endsWith('.gltf')) {
            return ModelLoader.fromGLTF(url);
        } else if (url.toLowerCase().endsWith('.glb')) {
            return ModelLoader.fromGLB(url);
        } else if (url.toLowerCase().endsWith('.fbx')) {
            return await ModelLoader.fromFbx(url, v => null);
        } else {
            throw `无法识别模型文件名 ${url}`
        }
    }

    static resourceCache = new Map<string, THREE.Object3D>();


    static fromResource(id: string) {
        return Promise.resolve(undefined);
    }
}

