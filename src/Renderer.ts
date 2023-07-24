import * as THREE from 'three';

export default class Renderer {
    p = new THREE.Vector3();
    q = new THREE.Quaternion();
    s = new THREE.Vector3();
    position = new THREE.Vector3(0, 0, 0.75)
    private dom: HTMLElement;
    private readonly _camera: THREE.PerspectiveCamera;
    private readonly _requestRender: () => void;
    private readonly _scene: THREE.Scene;
    private readonly _webGLRenderer: THREE.WebGLRenderer;
    private readonly _sceneHelper: THREE.Scene;

    set autoClear(v){
        this._webGLRenderer.autoClear = v;
    }

    clear(){
        this._webGLRenderer.clear();
    }

    constructor(dom) {
        const renderer = this.setupRenderer(dom);

        const camera = this.setupCamera();

        const scene = new THREE.Scene();

        function resizeRendererToDisplaySize(renderer) {
            const canvas = renderer.domElement;
            const width = dom.clientWidth;
            const height = dom.clientHeight;
            const needResize = canvas.width !== width || canvas.height !== height;
            if (needResize) {
                renderer.setSize(width, height, true);
            }
            return needResize;
        }

        let renderRequested = false;

        const sceneHelper = new THREE.Scene();
        renderer.autoClear = true;

        function render() {
            // renderer.autoClear = false;
            renderRequested = false;
            if (resizeRendererToDisplaySize(renderer)) {
                const canvas = renderer.domElement;
                camera.aspect = canvas.clientWidth / canvas.clientHeight;
                camera.updateProjectionMatrix();
            }

            renderer.render(scene, camera);

            // renderer.render(sceneHelper, camera);
            //
            // renderer.autoClear = true;

            requestAnimationFrame(render);
        }

        // render();

        this._sceneHelper = sceneHelper;

        function requestRenderIfNotRequested() {
           /* if (!renderRequested) {
                renderRequested = true;
                requestAnimationFrame(render);
            }*/
        }

        this._requestRender = requestRenderIfNotRequested;


        window.addEventListener('resize', requestRenderIfNotRequested);

        this.dom = dom;
        this._camera = camera;
        this._scene = scene;
        this._webGLRenderer = renderer;

    }

    render() {
        this._webGLRenderer.render(this.scene, this.camera);
    }

    setSky() {
        const loader = new THREE.TextureLoader();
        const texture = loader.load(
            'raw/sky2-deepblue.png',
            () => {
                const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
                rt.fromEquirectangularTexture(this._webGLRenderer, texture);
                // this.scene.background = rt.texture;
            });
    }

    get requestRender() {
        return this._requestRender;
    }

    get canvas() {
        return this._webGLRenderer.domElement;
    }

    get sceneHelper() {
        return this._sceneHelper;
    }

    get camera(): THREE.PerspectiveCamera {
        return this._camera;
    }


    get scene(): THREE.Scene {
        return this._scene;
    }


    get webGLRenderer(): THREE.WebGLRenderer {
        return this._webGLRenderer;
    }

    dispose() {
        window.removeEventListener('resize', this._requestRender);
        this.dom.removeChild(this._webGLRenderer.domElement);
        this.webGLRenderer.dispose();
    }

    private setupCamera() {
        const fov = 75;
        const aspect = 2;  // the canvas default
        const near = 0.1;
        const far = 100000;
        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.set(0, 0, -5);
        return camera;
    }

    private setupRenderer(dom) {
        const renderer = new THREE.WebGLRenderer({alpha: true});

        renderer.setSize(dom.clientWidth, dom.clientHeight);
        dom.appendChild(renderer.domElement);
        return renderer;
    }

    setColorSpace(v) {
        this._webGLRenderer.outputColorSpace = v;
    }

    updateToneMapping(v) {
        this._webGLRenderer.toneMapping = v;
    }
}
