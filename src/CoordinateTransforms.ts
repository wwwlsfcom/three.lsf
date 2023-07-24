import * as THREE from 'three';

/**
 * 空间坐标转换器
 */
export default class CoordinateTransforms {
	private readonly camera: any;
	private domElement: any;


	constructor( camera, domElement) {
		this.camera = camera;
		this.domElement = domElement;
	}


	/**
	 * 	屏幕位置转换为设备坐标
	 * @param x
	 * @param y
	 */
	screenToNDC( { x, y } ) {
		const rect = this.domElement.getBoundingClientRect();
		return {
			x: ( x - rect.left ) / rect.width * 2 - 1,
			y: - ( y - rect.top ) / rect.height * 2 + 1,
			z:0
		};
	}

	/**
	 * 设备坐标转换到屏幕坐标
	 * @param x
	 * @param y
	 * @constructor
	 */
	NDCtoScreen( { x, y } ) {
		// convert the normalized position to CSS coordinates
		const screenX = ( x * .5 + .5 ) * this.domElement.clientWidth;
		const screenY = ( y * - .5 + .5 ) * this.domElement.clientHeight;
		return { x: screenX, y: screenY };
	}


	/**
	 * 世界空间坐标到设备坐标
	 */
	worldToNDC( worldPosition ) {
		return worldPosition.project( this.camera );
	}

	/**
	 * 设备坐标到世界空间坐标
	 */
	NDCtoWorld( { x, y, z } ) {
		return new THREE.Vector3( x, y, z ).unproject( this.camera );
	}


	/**
	 * 屏幕坐标到世界空间坐标
	 * @param x
	 * @param y
	 */
	screenToWorld( { x, y } ) {
		return this.NDCtoWorld( this.screenToNDC( { x, y } ) );
	}

	/**
	 * 世界空间坐标到屏幕坐标
	 */
	worldToScreen( worldPosition ) {
		return this.NDCtoScreen( this.worldToNDC( worldPosition ) );
	}

}
