import L from "leaflet";
import "leaflet/dist/leaflet.css";
import polyline from "polyline"; // Install dulu: npm install polyline
import { useEffect, useState } from "react";
import {
  MapContainer,
  Polyline,
  Popup,
  TileLayer
} from "react-leaflet";
import "./Home.css";
// import { MapContainer, Polyline, Popup, TileLayer } from 'react-leaflet';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const Ruas = () => {
  const [user, setUser] = useState({ name: "User", email: "" });
  const [ruasJalan, setRuasJalan] = useState([]);

  useEffect(() => {
  const fetchRuasJalan = async () => {
    try {
      const token = localStorage.getItem("token"); // ambil token dari localStorage
      if (!token) {
        console.error("Token tidak ditemukan di localStorage");
        return;
      }

      const response = await fetch("https://gisapis.manpits.xyz/api/ruasjalan", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const err = await response.json();
        console.error("Gagal mengambil data ruas jalan:", err);
        return;
      }

      const data = await response.json();

      console.log(data)

      if (Array.isArray(data.ruasjalan)) {
        const decodedRuas = data.ruasjalan.map((ruas) => ({
          id: ruas.id,
          nama: ruas.nama_ruas,
          panjang: ruas.panjang,
          keterangan: ruas.keterangan,
          positions: polyline.decode(ruas.paths),
        }));

        setRuasJalan(decodedRuas);
      }
    } catch (error) {
      console.error("Gagal mengambil data ruas jalan:", error);
    }
  };

  fetchRuasJalan();
}, []);


  return (
    <div className="home-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>SIG WebApp</h2>
          <div className="user-info">
            <div className="avatar">{user.name.charAt(0)}</div>
            <div className="user-details">
              <h3>{user.name}</h3>
              <p>{user.email}</p>
            </div>
          </div>
        </div>

        <div className="sidebar-menu">
          <div className="menu-item active">
            <span>Ruas</span>
          </div>
        </div>

        {/* <div className="logout-button" onClick={handleLogout}>
          <span>Logout</span>
        </div> */}
      </div>

      <div className="main-content">
        <div className="header">
          <h1>Sistem Informasi Geografis</h1>
        </div>

        <div className="content">
          <div className="map-container">
            <MapContainer
              center={[-8.579585, 115.234219]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* <MapClickHandler /> */}

              {ruasJalan.map((ruas) => (
                <Polyline
                  key={ruas.id}
                  positions={ruas.positions}
                  color="blue"
                  weight={4}
                >
                  <Popup>
                    <div>
                      <h3>{ruas.nama}</h3>
                      <p>Panjang: {ruas.panjang} m</p>
                      <p>Keterangan: {ruas.keterangan}</p>
                    </div>
                  </Popup>
                </Polyline>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ruas;
