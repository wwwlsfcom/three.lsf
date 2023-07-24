import * as THREE from 'three'; // 不直接引用源文件路径, 使用这种方式可以保证跟html页面上一致

export function addMaterialGUI(gui, material, attributes) {

	if (material instanceof THREE.MeshPhysicalMaterial) {
		addPhysicalMaterial(gui, material, attributes);
	} else if (material instanceof THREE.MeshStandardMaterial)
		addMeshStandardMaterial(gui, material, attributes)

}

export function addPhysicalMaterial(gui, material, attributes) {
	addMeshStandardMaterial(gui, material, attributes);
	if (attributes.includes('clearcoat')) gui.add(material, 'clearcoat', 0, 1)
	if (attributes.includes('clearcoatRoughness')) gui.add(material, 'clearcoatRoughness', 0, 1)

	addSelectorForAttribute(gui, material, attributes, 'clearcoatNormalMap');

	if (attributes.includes('ior')) gui.add(material, 'ior', 1.0, 2.333);

	if (attributes.includes('transmission')) gui.add(material, 'transmission', 0.0, 1.0);
	if (attributes.includes('specularIntensity')) gui.add(material, 'specularIntensity', 0.0, 1.0);
	if (attributes.includes('specularColor')) gui.addColor(material, 'specularColor');
}


export function addMeshStandardMaterial(gui, material, attributes) {
	addBaseMaterial(gui, material, attributes)

	if (attributes.includes('metalness')) gui.add(material, 'metalness', 0, 1)
	if (attributes.includes('roughness')) gui.add(material, 'roughness', 0, 1)

	addSelectorForAttribute(gui, material, attributes, 'normalMap');

	if (attributes.includes('normalScale')) {
		const normalScaleFolder = gui.addFolder("normalScale")
		normalScaleFolder.add(material.normalScale, "height")
		normalScaleFolder.add(material.normalScale, 'width')
	}

	if (attributes.includes('envMapIntensity')) gui.add(material, 'envMapIntensity')

	addSelectorForAttribute(gui, material, attributes, 'alphaMap');
}


export function addBaseMaterial(gui, material, attributes) {
	if (attributes.includes('color')) gui.addColor(material, 'color')
	if (attributes.includes('opacity')) gui.add(material, 'opacity')
	if (attributes.includes('side')) gui.add(material, 'side', {
		'back': THREE.BackSide, 'front': THREE.FrontSide, '双面': THREE.DoubleSide
	})
	if (attributes.includes('transparent')) gui.add(material, 'transparent')
	if (attributes.includes('premultipliedAlpha')) gui.add(material, 'premultipliedAlpha')
	if (attributes.includes('reflectivity')) gui.add(material, 'reflectivity', 0, 1)
	addSelectorForAttribute(gui, material, attributes, 'envMap');
}


/**
 * 创建使用下拉列表选择值的属性
 */
function addSelectorForAttribute(gui, material, attributes, attrName) {
	const value = attributes.find(n => n.hasOwnProperty(attrName))
	if (value) {
		gui.add(material, attrName, value[attrName])
	}
}
