import { useEffect, useState } from "react";

const MapContainer = () => {
  const [address, setAddress] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [cafes, setCafes] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapObj, setMapObj] = useState(null);
  const [markerObj, setMarkerObj] = useState(null);
  const [myMarkers, setMyMarkers] = useState([]);
  const [myMarkerObjects, setMyMarkerObjects] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (userId) {
      fetch(`http://localhost:5000/user/${userId}/places`)
        .then(res => res.json())
        .then(data => {
          setMyMarkers(data);
          if (mapObj) {
            const markers = data.map(place => {
              const position = new window.kakao.maps.LatLng(place.latitude, place.longitude);
              const marker = new window.kakao.maps.Marker({ position, map: mapObj });
              return { name: place.name, marker };
            });
            setMyMarkerObjects(markers);
          }
        });
    }
  }, [mapObj]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const scriptId = "kakao-map-script";
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => drawMap());
      } else {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src =
          "https://dapi.kakao.com/v2/maps/sdk.js?appkey=03c7983b8aaebda8b6d24623d598eab1&autoload=false&libraries=services";
        script.async = true;
        script.onload = () => window.kakao.maps.load(() => drawMap());
        document.head.appendChild(script);
      }
    });
  }, []);

  function handleDeleteMarker() {
    const user_id = localStorage.getItem("user_id");
    fetch("http://localhost:5000/delete_place", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: selectedPlace.place_name,
        user_id: user_id
      })
    })
      .then(res => res.json())
      .then(() => {
        setMyMarkers(prev => prev.filter(m => m.name !== selectedPlace.place_name));

        const target = myMarkerObjects.find(m =>
          m.marker.getPosition().getLat() === parseFloat(selectedPlace.y) &&
          m.marker.getPosition().getLng() === parseFloat(selectedPlace.x)
        );

        if (target) {
          target.marker.setMap(null);
          setMyMarkerObjects(prev => prev.filter(m =>
            m.marker.getPosition().getLat() !== parseFloat(selectedPlace.y) ||
            m.marker.getPosition().getLng() !== parseFloat(selectedPlace.x)
          ));
        }

        setSelectedPlace(null);
        window.location.reload(); // ✅ 여기 추가!
      });
  }



  const isMyMarker = myMarkers.some(marker => marker.name === selectedPlace?.place_name);

  function drawMap() {
    const container = document.getElementById("map");
    if (!container) return;

    const userId = localStorage.getItem("user_id");
    const defaultCenter = new window.kakao.maps.LatLng(37.557466, 126.924363);

    const map = new window.kakao.maps.Map(container, {
      center: defaultCenter,
      level: 3,
    });

    setMapObj(map);

    fetch("http://localhost:5000/places")
      .then(res => res.json())
      .then(data => {
        data.forEach(place => {
          const position = new window.kakao.maps.LatLng(place.latitude, place.longitude);
          const marker = new window.kakao.maps.Marker({
            position: position,
            map: map
          });

          const infowindow = new window.kakao.maps.InfoWindow({
            content: `<div style="
                    padding: 10px;
                    font-size: 14px;
                    width: 250px;
                    line-height: 1.6;
                    word-break: keep-all;
                  ">
                    <strong>${place.name}</strong><br/>
                    ${place.address}<br/>
                    <a href="https://map.kakao.com/link/map/${place.name},${place.latitude},${place.longitude}" target="_blank" style="color: blue;">지도에서 보기</a>
                  </div>`,
            removable: true
          });

          window.kakao.maps.event.addListener(marker, 'click', function () {
            infowindow.open(map, marker);
          });
        });
      })
      .catch(err => {
        console.error("❌ 전체 마커 불러오기 실패:", err);
      });


    function createMarkerAndHandleDrag(lat, lng) {
      const userPosition = new window.kakao.maps.LatLng(lat, lng);

      const marker = new window.kakao.maps.Marker({
        position: userPosition,
        draggable: true
      });

      marker.setMap(map);
      map.setCenter(userPosition);

      const geocoder = new window.kakao.maps.services.Geocoder();
      const infowindow = new window.kakao.maps.InfoWindow({ removable: true });

      window.kakao.maps.event.addListener(marker, 'click', function () {
        geocoder.coord2Address(userPosition.getLng(), userPosition.getLat(), function (result, status) {
          if (status === window.kakao.maps.services.Status.OK) {
            const address = result[0].address.address_name;
            const content = `<div style="padding:10px; font-size:14px;">📍 ${address}</div>`;
            infowindow.setContent(content);
            infowindow.open(map, marker);
          }
        });
      });

      window.kakao.maps.event.addListener(marker, 'dragend', function () {
        const pos = marker.getPosition();
        const newLat = pos.getLat();
        const newLng = pos.getLng();

        if (userId) {
          fetch(`http://localhost:5000/user/${userId}/location`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ latitude: newLat, longitude: newLng })
          });
        }
      });
    }

    window.kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
      const latlng = mouseEvent.latLng;
      const geocoder = new window.kakao.maps.services.Geocoder();
      const places = new window.kakao.maps.services.Places();

      geocoder.coord2Address(latlng.getLng(), latlng.getLat(), function (result, status) {
        if (status === window.kakao.maps.services.Status.OK) {
          setAddress(result[0].address.address_name);
        }
      });

      places.categorySearch('FD6', (data, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setRestaurants(data);
        }
      }, { location: latlng, radius: 500 });

      places.categorySearch('CE7', (data, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setCafes(data);
        }
      }, { location: latlng, radius: 500 });
    });

    if (userId) {
      fetch(`http://localhost:5000/user/${userId}/location`)
        .then(res => res.json())
        .then(data => {
          if (data.latitude != null && data.longitude != null) {
            createMarkerAndHandleDrag(data.latitude, data.longitude);
          } else {
            loadCurrentPosition();
          }
        })
        .catch(() => {
          loadCurrentPosition();
        });
    } else {
      createMarkerAndHandleDrag(37.55406383694701, 126.92058772873095);
    }

    function loadCurrentPosition() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            createMarkerAndHandleDrag(position.coords.latitude, position.coords.longitude);
          },
          () => {
            createMarkerAndHandleDrag(37.55406383694701, 126.92058772873095);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        createMarkerAndHandleDrag(37.55406383694701, 126.92058772873095);
      }
    }
  }

  const handlePlaceClick = (place) => {
    setSelectedPlace(place);
  };

  const handleAddMarker = () => {
    if (selectedPlace && mapObj) {
      const latlng = new window.kakao.maps.LatLng(selectedPlace.y, selectedPlace.x);
      const marker = new window.kakao.maps.Marker({
        position: latlng,
        map: mapObj,
      });
      mapObj.setCenter(latlng);

      setMyMarkerObjects(prev => [...prev, { name: selectedPlace.place_name, marker }]);

      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="
              padding: 10px; 
              font-size: 14px; 
              width: 250px;
              line-height: 1.6;
              word-break: keep-all;
            ">
              <strong>${selectedPlace.place_name}</strong><br/>
              ${selectedPlace.address_name}<br/>
              ${selectedPlace.phone || '📞 정보 없음'}<br/>
              <a href="${selectedPlace.place_url}" target="_blank" rel="noreferrer" style="color: blue;">지도에서 보기</a>
            </div>`,
        removable: true
      });


      infowindow.open(mapObj, marker);

      // ✅ 마커 클릭 시 다시 열 수 있게
      window.kakao.maps.event.addListener(marker, 'click', function () {
        infowindow.open(mapObj, marker);
      });

      setMarkerObj(marker);

      // 🔥 DB 저장
      const user_id = localStorage.getItem("user_id");
      fetch("http://localhost:5000/add_place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedPlace.place_name,
          latitude: selectedPlace.y,
          longitude: selectedPlace.x,
          address: selectedPlace.address_name,
          category: selectedPlace.category_group_name || "미분류",
          user_id: user_id
        })
      })
        .then(res => res.json())
        .then(data => {
          console.log("✅ DB 저장 완료:", data);
          window.location.reload();
        })
        .catch(err => {
          console.error("❌ DB 저장 실패:", err);
        });
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        id="map"
        style={{
          width: "800px",
          height: "500px",
          border: "1px solid #ccc",
          borderRadius: "10px",
          marginTop: "20px"
        }}
      ></div>

      {address && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginTop: '20px', width: '100%', maxWidth: '800px' }}>
          <div style={{ flex: 1 }}>
            <h4>🍽 음식점</h4>
            <ul style={{ listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
              {restaurants.map((place, index) => (
                <li key={index}>
                  <button
                    onClick={() => handlePlaceClick(place)}
                    style={{ all: 'unset', cursor: 'pointer', color: 'blue' }}
                  >
                    {place.place_name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ width: '1px', backgroundColor: '#ccc' }}></div> {/* 구분선 */}
          <div style={{ flex: 1 }}>
            <h4>☕ 카페</h4>
            <ul style={{ listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
              {cafes.map((place, index) => (
                <li key={index}>
                  <button
                    onClick={() => handlePlaceClick(place)}
                    style={{ all: 'unset', cursor: 'pointer', color: 'green' }}
                  >
                    {place.place_name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {selectedPlace && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '10px',
            padding: '20px',
            zIndex: 9999,
            width: '300px'
          }}
        >
          <h3>{selectedPlace.place_name}</h3>
          <p>📍 {selectedPlace.address_name}</p>
          <p>📞 {selectedPlace.phone || '정보 없음'}</p>
          <a href={selectedPlace.place_url} target="_blank" rel="noreferrer">지도에서 보기</a>
          <br />
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setSelectedPlace(null)}>닫기</button>
            {!isMyMarker ? (
              <button onClick={handleAddMarker}>마커 추가</button>
            ) : (
              <button onClick={handleDeleteMarker}>마커 삭제</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


export default MapContainer;
