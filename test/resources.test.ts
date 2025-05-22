import { expect, test, describe } from 'bun:test';
import { 
  parseResourcesFromXml, 
  ObjectType, 
  ResourcesParseError 
} from '../src/resources';

describe('Resources Parsing', () => {
  test('should parse base materials correctly', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
      <resources>
        <basematerials id="1">
          <base name="Red" displaycolor="#FF0000" />
          <base name="Green" displaycolor="#00FF00" />
          <base name="Blue" displaycolor="#0000FF" />
        </basematerials>
      </resources>
      <build></build>
    </model>`;
    
    const resources = parseResourcesFromXml(xml);
    expect(resources.baseMaterials.size).toBe(1);
    
    const materials = resources.baseMaterials.get(1);
    expect(materials).toBeDefined();
    if (!materials) return; // For TypeScript type checking
    
    expect(materials.materials.length).toBe(3);
    
    const redMaterial = materials.materials[0];
    const greenMaterial = materials.materials[1];
    const blueMaterial = materials.materials[2];

    expect(redMaterial).toBeDefined();
    expect(greenMaterial).toBeDefined();
    expect(blueMaterial).toBeDefined();

    if (redMaterial) {
      expect(redMaterial.name).toBe('Red');
      expect(redMaterial.displayColor).toBe('#FF0000');
    }
    
    if (greenMaterial) {
      expect(greenMaterial.name).toBe('Green');
      expect(greenMaterial.displayColor).toBe('#00FF00');
    }
    
    if (blueMaterial) {
      expect(blueMaterial.name).toBe('Blue');
      expect(blueMaterial.displayColor).toBe('#0000FF');
    }
  });
  
  test('should parse multiple base materials groups', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
      <resources>
        <basematerials id="1">
          <base name="Red" displaycolor="#FF0000" />
        </basematerials>
        <basematerials id="2">
          <base name="Green" displaycolor="#00FF00" />
        </basematerials>
      </resources>
      <build></build>
    </model>`;
    
    const resources = parseResourcesFromXml(xml);
    expect(resources.baseMaterials.size).toBe(2);
    
    const material1 = resources.baseMaterials.get(1);
    const material2 = resources.baseMaterials.get(2);
    
    expect(material1).toBeDefined();
    expect(material2).toBeDefined();
    
    if (material1 && material1.materials && material1.materials.length > 0) {
      const redMaterial = material1.materials[0];
      if (redMaterial) {
        expect(redMaterial.name).toBe('Red');
      }
    }
    
    if (material2 && material2.materials && material2.materials.length > 0) {
      const greenMaterial = material2.materials[0];
      if (greenMaterial) {
        expect(greenMaterial.name).toBe('Green');
      }
    }
  });
  
  test('should throw on duplicate base materials id', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
      <resources>
        <basematerials id="1">
          <base name="Red" displaycolor="#FF0000" />
        </basematerials>
        <basematerials id="1">
          <base name="Green" displaycolor="#00FF00" />
        </basematerials>
      </resources>
      <build></build>
    </model>`;
    
    expect(() => parseResourcesFromXml(xml)).toThrow(ResourcesParseError);
    expect(() => parseResourcesFromXml(xml)).toThrow('Duplicate base materials group ID: 1');
  });
  
  test('should parse objects correctly', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
      <resources>
        <object id="1" name="Cube" type="model">
          <mesh>
            <vertices></vertices>
            <triangles></triangles>
          </mesh>
        </object>
      </resources>
      <build></build>
    </model>`;
    
    const resources = parseResourcesFromXml(xml);
    expect(resources.objects.size).toBe(1);
    
    const object = resources.objects.get(1);
    expect(object).toBeDefined();
    if (!object) return; // For TypeScript type checking
    
    expect(object.id).toBe(1);
    expect(object.name).toBe('Cube');
    expect(object.type).toBe(ObjectType.Model);
    expect(object.hasMesh).toBe(true);
    expect(object.hasComponents).toBe(false);
  });
  
  test('should parse objects with components', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
      <resources>
        <object id="1" name="Component" type="model">
          <mesh>
            <vertices></vertices>
            <triangles></triangles>
          </mesh>
        </object>
        <object id="2" name="Assembly">
          <components>
            <component objectid="1" />
          </components>
        </object>
      </resources>
      <build></build>
    </model>`;
    
    const resources = parseResourcesFromXml(xml);
    expect(resources.objects.size).toBe(2);
    
    const component = resources.objects.get(1);
    const assembly = resources.objects.get(2);
    
    expect(component).toBeDefined();
    expect(assembly).toBeDefined();
    
    if (component) {
      expect(component.hasMesh).toBe(true);
      expect(component.hasComponents).toBe(false);
    }
    
    if (assembly) {
      expect(assembly.hasMesh).toBe(false);
      expect(assembly.hasComponents).toBe(true);
    }
  });
  
  test('should throw on duplicate object id', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
      <resources>
        <object id="1" name="First">
          <mesh>
            <vertices></vertices>
            <triangles></triangles>
          </mesh>
        </object>
        <object id="1" name="Second">
          <mesh>
            <vertices></vertices>
            <triangles></triangles>
          </mesh>
        </object>
      </resources>
      <build></build>
    </model>`;
    
    expect(() => parseResourcesFromXml(xml)).toThrow(ResourcesParseError);
    expect(() => parseResourcesFromXml(xml)).toThrow('Duplicate object ID: 1');
  });
  
  test('should throw if object has both mesh and components', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
      <resources>
        <object id="1" name="Invalid">
          <mesh>
            <vertices></vertices>
            <triangles></triangles>
          </mesh>
          <components>
            <component objectid="2" />
          </components>
        </object>
        <object id="2" name="Other">
          <mesh>
            <vertices></vertices>
            <triangles></triangles>
          </mesh>
        </object>
      </resources>
      <build></build>
    </model>`;
    
    expect(() => parseResourcesFromXml(xml)).toThrow(ResourcesParseError);
    expect(() => parseResourcesFromXml(xml)).toThrow('Object 1 has both mesh and components, which is not allowed');
  });
  
  test('should throw if object has neither mesh nor components', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
      <resources>
        <object id="1" name="Invalid">
          <!-- Missing both mesh and components -->
        </object>
      </resources>
      <build></build>
    </model>`;
    
    expect(() => parseResourcesFromXml(xml)).toThrow(ResourcesParseError);
    expect(() => parseResourcesFromXml(xml)).toThrow('Object 1 has neither mesh nor components');
  });
  
  test('should parse pid and pindex correctly', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
      <resources>
        <basematerials id="5">
          <base name="Red" displaycolor="#FF0000" />
          <base name="Green" displaycolor="#00FF00" />
        </basematerials>
        <object id="1" name="ColoredObject" pid="5" pindex="1">
          <mesh>
            <vertices></vertices>
            <triangles></triangles>
          </mesh>
        </object>
      </resources>
      <build></build>
    </model>`;
    
    const resources = parseResourcesFromXml(xml);
    const object = resources.objects.get(1);
    
    expect(object).toBeDefined();
    if (object) {
      expect(object.pid).toBe(5);
      expect(object.pindex).toBe(1);
    }
  });
}); 