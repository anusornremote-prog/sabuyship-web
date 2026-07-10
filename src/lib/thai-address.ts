import td from 'thai-data';

export interface Province {
  provinceId: string;
  provinceName: string;
}

export interface District {
  districtId: string;
  proviceId: string; // Note the spelling from thai-data
  districtName: string;
}

export interface SubDistrict {
  subDistrictId: string;
  districtId: string;
  provinceId: string;
  subDistrictName: string;
}

const allData = td.getAllData();

export const getProvinces = (): Province[] => {
  const map = new Map<string, Province>();
  allData.forEach(z => {
    z.provinceList.forEach(p => map.set(p.provinceName, p));
  });
  return Array.from(map.values()).sort((a, b) => a.provinceName.localeCompare(b.provinceName, 'th'));
};

export const getDistricts = (provinceName: string): District[] => {
  if (!provinceName) return [];
  const map = new Map<string, District>();
  allData
    .filter(z => z.provinceList.some(p => p.provinceName === provinceName))
    .forEach(z => {
      z.districtList.forEach(d => map.set(d.districtName, d));
    });
  return Array.from(map.values()).sort((a, b) => a.districtName.localeCompare(b.districtName, 'th'));
};

export const getSubDistricts = (provinceName: string, districtName: string): SubDistrict[] => {
  if (!provinceName || !districtName) return [];
  const map = new Map<string, SubDistrict>();
  allData
    .filter(z => 
      z.provinceList.some(p => p.provinceName === provinceName) &&
      z.districtList.some(d => d.districtName === districtName)
    )
    .forEach(z => {
      z.subDistrictList.forEach(s => map.set(s.subDistrictName, s));
    });
  return Array.from(map.values()).sort((a, b) => a.subDistrictName.localeCompare(b.subDistrictName, 'th'));
};

export const getZipCode = (provinceName: string, districtName: string, subDistrictName: string): string => {
  if (!provinceName || !districtName || !subDistrictName) return "";
  const match = allData.find(z => 
    z.provinceList.some(p => p.provinceName === provinceName) &&
    z.districtList.some(d => d.districtName === districtName) &&
    z.subDistrictList.some(s => s.subDistrictName === subDistrictName)
  );
  return match ? match.zipCode : "";
};
