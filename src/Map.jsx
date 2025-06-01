'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axios from 'axios';
import { useEffect, useState } from 'react';
import {
  Circle,
  FeatureGroup,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
} from 'react-leaflet';
import { decode } from 'polyline-encoded';
import L from 'leaflet';
import { EditControl } from 'react-leaflet-draw';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  fetchDesa,
  fetchExisting,
  fetchJenisJalan,
  fetchKecamatan,
  fetchKondisi,
  fetchRegion,
} from '@/app/(dashboard)/lib/data';
import polyline from '@mapbox/polyline';

const listTiles = [
  {
    name: 'Open Street Map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    name: 'Esri World Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
];

const Map = () => {
  const [ruasJalan, setRuasJalan] = useState([]);
  const [selectedTile, setSelectedTile] = useState(listTiles[0]);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [createdLineLatLngs, setCreatedLineLatLngs] = useState([]);
  const [calculatedPanjang, setCalculatedPanjang] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [kabupaten, setKabupaten] = useState([]);
  const [kecamatan, setKecamatan] = useState([]);
  const [desa, setDesa] = useState([]);

  const [selectedKabupatenId, setSelectedKabupatenId] = useState(null);
  const [selectedKecamatanId, setSelectedKecamatanId] = useState(null);

  const [existing, setExisting] = useState([]);
  const [kondisi, setKondisi] = useState([]);
  const [jenisJalan, setJenisJalan] = useState([]);

  // FETCH LINE RUAS JALAN
  useEffect(() => {
    const fetchRuasJalan = async () => {
      try {
        const authToken = localStorage.getItem('gis_token');

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_GIS_API_URL}/api/ruasjalan`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        const decodedRuas = response.data.ruasjalan.map((ruas) => ({
          ...ruas,
          pathsDecoded: L.Polyline.fromEncoded(ruas.paths).getLatLngs(),
        }));

        setRuasJalan(decodedRuas);
      } catch (error) {
        console.error('Error fetching ruas jalan data:', error);
      }
    };

    fetchRuasJalan();
  }, []);

  // FETCH INITIAL DATA
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [kab, eks, kond, jenis] = await Promise.all([
          fetchRegion(),
          fetchExisting(),
          fetchKondisi(),
          fetchJenisJalan(),
        ]);

        setKabupaten(kab?.data?.kabupaten || []);
        setExisting(eks?.data?.eksisting || []);
        setKondisi(kond?.data?.eksisting || []);
        setJenisJalan(jenis?.data?.eksisting || []);
      } catch (error) {
        console.error('Gagal mengambil data awal:', error);
      }
    };

    fetchInitialData();
  }, []);

  // FETCH KECAMATAN/DESA BASED ON SELECTED KABUPATEN/KECAMATAN
  useEffect(() => {
    const fetchDependentData = async () => {
      try {
        if (selectedKabupatenId) {
          const response = await fetchKecamatan({
            kabupatenId: selectedKabupatenId,
          });
          setKecamatan(response.data.kecamatan || []);
          setDesa([]); // Reset desa saat kabupaten berubah
        }

        if (selectedKecamatanId) {
          const response = await fetchDesa({
            kecamatanId: selectedKecamatanId,
          });
          setDesa(response.data.desa || []);
        }
      } catch (error) {
        console.error('Gagal mengambil data kecamatan/desa:', error);
      }
    };

    fetchDependentData();
  }, [selectedKabupatenId, selectedKecamatanId]);

  const _created = (e) => {
    const latlngs = e.layer.getLatLngs();
    setCreatedLineLatLngs(latlngs);

    let totalLength = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
      totalLength += latlngs[i].distanceTo(latlngs[i + 1]);
    }

    const lengthInKm = (totalLength / 1000).toFixed(2);
    setCalculatedPanjang(parseFloat(lengthInKm));

    setOpenDrawer(true);
    // console.log('Polyline created:', latlngs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const encodedPath = polyline.encode(
      createdLineLatLngs.map((point) => [point.lat, point.lng])
    );

    const formData = new FormData(e.currentTarget);
    const nama_ruas = formData.get('nama_ruas');
    const panjang = formData.get('panjang');
    const lebar = formData.get('lebar');
    const desa_id = formData.get('desa_id');
    const eksisting_id = formData.get('eksisting_id');
    const kondisi_id = formData.get('kondisi_id');
    const jenisjalan_id = formData.get('jenisjalan_id');
    const keterangan = formData.get('keterangan');
    const paths = encodedPath;

    try {
      const token = localStorage.getItem('gis_token');
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_GIS_API_URL}/api/ruasjalan`,
        {
          paths: paths,
          desa_id: desa_id,
          kode_ruas: nama_ruas,
          nama_ruas: nama_ruas,
          panjang: panjang,
          lebar: lebar,
          eksisting_id: eksisting_id,
          kondisi_id: kondisi_id,
          jenisjalan_id: jenisjalan_id,
          keterangan: keterangan,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLoading(false);
      setOpenDrawer(false);
      console.log(res);
    } catch (error) {
      // console.error('Gagal menyimpan data:', error);
      // console.error(error?.response?.status);

      if (error?.response?.data.message === 500) {
        setError('Data yang dimasukkan tidak valid. Silakan periksa kembali.');
      }
    }
  };

  return (
    <>
      <div className='rounded-lg flex w-full overflow-hidden relative'>
        <div className='absolute top-2 right-16 z-[9]'>
          <Select
            defaultValue={selectedTile.name}
            onValueChange={(val) => {
              const tile = listTiles.find((t) => t.name === val);
              if (tile) setSelectedTile(tile);
            }}>
            <SelectTrigger className='w-[180px] dark:bg-white dark:text-primary-foreground dark:hover:bg-primary'>
              <SelectValue placeholder='Theme' />
            </SelectTrigger>
            <SelectContent className='dark:bg-white dark:text-primary-foreground'>
              {listTiles.map((tile, index) => (
                <SelectItem
                  className='dark:hover:bg-primary dark:focus:bg-primary dark:focus:text-primary-foreground'
                  key={index}
                  value={tile.name}>
                  {tile.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <MapContainer
          center={[-8.8035, 115.1762]}
          zoom={10}
          scrollWheelZoom={false}
          className='flex-1 h-[760px]'>
          <TileLayer
            url={selectedTile.url}
            attribution={selectedTile.attribution}
          />

          <FeatureGroup>
            <EditControl
              onCreated={_created}
              position='topright'
              draw={{
                rectangle: false,
                circle: false,
                circlemarker: false,
                marker: false,
                polygon: false,
              }}
            />
            <Circle
              center={[51.51, -0.06]}
              radius={200}
            />
          </FeatureGroup>

          {ruasJalan.map((ruas, i) => (
            <Polyline
              key={i}
              positions={[ruas.pathsDecoded]}
              color='purple'
              weight={3}>
              <Popup>
                <div className='text-sm'>
                  <span className='font-semibold'>{ruas.nama_ruas}</span>
                  <p>Panjang: {ruas.panjang}</p>
                  <p>Keterangan: {ruas.keterangan}</p>
                </div>
              </Popup>
            </Polyline>
          ))}

          <Drawer
            direction='right'
            open={openDrawer}
            onOpenChange={setOpenDrawer}>
            <DrawerContent className=''>
              <DrawerHeader>
                <DrawerTitle>Are you absolutely sure?</DrawerTitle>
                <DrawerDescription>
                  This action cannot be undone.
                </DrawerDescription>
              </DrawerHeader>

              {error && (
                <div className='bg-destructive text-white dark:bg-destructive/60  py-3 rounded-lg max-w-[364px] mx-auto'>
                  <p className='text-sm text-center mx-2'>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className='p-4'>
                  <div className='space-y-4'>
                    <div className='grid w-full max-w-sm items-center gap-1.5'>
                      <Label htmlFor='nama_ruas'>Nama Ruas</Label>
                      <Input
                        id='nama_ruas'
                        name='nama_ruas'
                        required
                      />
                    </div>

                    <div className='grid w-full max-w-sm items-center gap-1.5'>
                      <Label htmlFor='desa_id'>Kabupaten</Label>
                      <Select
                        required
                        onValueChange={(val) => {
                          const selected = kabupaten.find(
                            (item) => item.kabupaten === val
                          );
                          if (selected) setSelectedKabupatenId(selected.id);
                        }}>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Pilih kabupaten' />
                        </SelectTrigger>
                        <SelectContent>
                          {kabupaten.map((item) => (
                            <SelectItem
                              key={item.id}
                              value={item.kabupaten}>
                              {item.kabupaten}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='grid w-full max-w-sm items-center gap-1.5'>
                      <Label htmlFor='desa_id'>Kecamatan</Label>

                      <Select
                        required
                        onValueChange={(val) => {
                          setSelectedKecamatanId(Number(val)); // pastikan ID disimpan
                        }}>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Pilih kecamatan' />
                        </SelectTrigger>
                        <SelectContent>
                          {kecamatan.map((item) => (
                            <SelectItem
                              key={item.id}
                              value={item.id.toString()}>
                              {item.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='grid w-full max-w-sm items-center gap-1.5'>
                      <Label htmlFor='desa_id'>Desa</Label>

                      <Select
                        name='desa_id'
                        required>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Pilih desa' />
                        </SelectTrigger>
                        <SelectContent>
                          {desa.map((item) => (
                            <SelectItem
                              key={item.id}
                              value={item.id.toString()}>
                              {item.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='grid w-full max-w-sm items-center gap-1.5'>
                      <Label htmlFor='panjang'>Panjang (km)</Label>
                      <Input
                        id='panjang'
                        name='panjang'
                        required
                        readOnly
                        value={calculatedPanjang}
                      />
                    </div>

                    <div className='grid w-full max-w-sm items-center gap-1.5'>
                      <Label htmlFor='lebar'>Lebar</Label>
                      <Input
                        id='lebar'
                        name='lebar'
                        required
                      />
                    </div>

                    <div className='grid w-full max-w-sm items-center gap-1.5'>
                      <Label htmlFor='eksisting_id'>Existing</Label>

                      <Select
                        name='eksisting_id'
                        required>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Pilih desa' />
                        </SelectTrigger>
                        <SelectContent>
                          {existing.map((item) => (
                            <SelectItem
                              key={item.id}
                              value={item.id.toString()}>
                              {item.eksisting}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='grid w-full max-w-sm items-center gap-1.5'>
                      <Label htmlFor='kondisi_id'>Kondisi</Label>
                      <Select
                        name='kondisi_id'
                        required>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Pilih desa' />
                        </SelectTrigger>
                        <SelectContent>
                          {kondisi.map((item) => (
                            <SelectItem
                              key={item.id}
                              value={item.id.toString()}>
                              {item.kondisi}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='grid w-full max-w-sm items-center gap-1.5'>
                      <Label htmlFor='jenisJalan_id'>Jenis Jalan</Label>
                      <Select
                        name='jenisjalan_id'
                        required>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Pilih desa' />
                        </SelectTrigger>
                        <SelectContent>
                          {jenisJalan.map((item) => (
                            <SelectItem
                              key={item.id}
                              value={item.id.toString()}>
                              {item.jenisjalan}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='grid w-full max-w-sm items-center gap-1.5'>
                      <Label htmlFor='keterangan'>Keterangan</Label>
                      <Input
                        id='keterangan'
                        name='keterangan'
                        required
                      />
                    </div>
                  </div>
                </div>

                <DrawerFooter>
                  <Button
                    type='submit'
                    disabled={loading}>
                    {loading ? 'Loading...' : 'Tambah Ruas'}
                  </Button>
                </DrawerFooter>
              </form>
            </DrawerContent>
          </Drawer>
        </MapContainer>
      </div>
    </>
  );
};
export default Map;