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
  const [tempMarker, setTempMarker] = useState(null);
  const [tempInfoWindow, setTempInfoWindow] = useState(null);
  const [allMarkers, setAllMarkers] = useState([]);

  useEffect(() => {
    const scriptId = "kakao-map-script";
    const existingScript = document.getElementById(scriptId);

    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => drawMap());
      return;
    }

    if (existingScript) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=03c7983b8aaebda8b6d24623d598eab1&autoload=false&libraries=services";
    script.async = true;
    script.onload = () => window.kakao.maps.load(() => drawMap());
    document.head.appendChild(script);
  }, []);


  function handleDeleteMarker() {
    const user_id = localStorage.getItem("user_id");
    console.log("🗑 삭제 요청 시작:", selectedPlace.place_name);

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
        console.log("✅ DB 삭제 완료");

        setMyMarkers(prev => {
          const updated = prev.filter(m => m.name !== selectedPlace.place_name);
          console.log("🧹 마커 상태에서 제거됨:", updated);
          return updated;
        });

        setAllMarkers(prev => {
          const isCloseEnough = (a, b) => Math.abs(a - b) < 0.00001;

          const updated = prev.filter(m => {
            const match =
              m.name === selectedPlace.place_name &&
              isCloseEnough(m.lat, parseFloat(selectedPlace.y)) &&
              isCloseEnough(m.lng, parseFloat(selectedPlace.x));

            if (match) {
              console.log("🗑 마커 삭제 대상:", m);
              m.marker.setMap(null);
              console.log("🧪 삭제 후 getMap:", m.marker.getMap());
            }
            return !match;
          });
          return updated;
        });

        setSelectedPlace(null);
      });
  }

  const user_id = localStorage.getItem("user_id");
  const isMyMarker = allMarkers.some(marker =>
    marker.name === selectedPlace?.place_name &&
    marker.user_id === user_id
  );

  function drawMap() {
    const container = document.getElementById("map");
    if (!container) return;

    const userId = localStorage.getItem("user_id");
    const defaultCenter = new window.kakao.maps.LatLng(37.557466, 126.924363);
    const map = new window.kakao.maps.Map(container, {
      center: defaultCenter,
      level: 3,
    });

    const zoomControl = new window.kakao.maps.ZoomControl();
    map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
    setMapObj(map);

    const isCloseEnough = (a, b) => Math.abs(a - b) < 0.00001;

    fetch(`http://localhost:5000/user/${userId}/places`)
      .then(res => res.json())
      .then(userPlaces => {
        const myMarkers = userPlaces.map(place => {
          const pos = new window.kakao.maps.LatLng(place.latitude, place.longitude);
          const marker = new window.kakao.maps.Marker({ position: pos, map });

          window.kakao.maps.event.addListener(marker, 'click', () => {
            fetch("http://localhost:5000/places")
              .then(res => res.json())
              .then(allPlaces => {
                const matched = allPlaces.find(p =>
                  p.name === place.name &&
                  Math.abs(parseFloat(p.latitude) - parseFloat(place.latitude)) < 0.00001 &&
                  Math.abs(parseFloat(p.longitude) - parseFloat(place.longitude)) < 0.00001
                );

                if (matched) {
                  console.log("🧪 최신 usernames:", matched.usernames);
                  setSelectedPlace({
                    place_name: matched.name,
                    address_name: matched.address,
                    y: matched.latitude,
                    x: matched.longitude,
                    phone: matched.phone,
                    place_url: matched.place_url,
                    usernames: matched.usernames
                      ? matched.usernames.split(',').map(n => n.trim())
                      : []
                  });
                  map.panTo(marker.getPosition());
                }
              });
          });


          return {
            name: place.name,
            lat: parseFloat(place.latitude),
            lng: parseFloat(place.longitude),
            user_id: place.user_id,
            marker: marker,
            category: place.category,
            phone: place.phone
          };
        });

        setAllMarkers(myMarkers);
        setMyMarkers(userPlaces);

        fetch("http://localhost:5000/places")
          .then(res => res.json())
          .then(allPlaces => {
            allPlaces.forEach(place => {
              if (place.user_id === userId) return;

              const alreadyExists = myMarkers.some(m =>
                m.name === place.name &&
                isCloseEnough(m.lat, parseFloat(place.latitude)) &&
                isCloseEnough(m.lng, parseFloat(place.longitude))
              );
              if (alreadyExists) return;

              const pos = new window.kakao.maps.LatLng(place.latitude, place.longitude);
              const marker = new window.kakao.maps.Marker({ position: pos, map });

              window.kakao.maps.event.addListener(marker, 'click', () => {
                fetch("http://localhost:5000/places")
                  .then(res => res.json())
                  .then(allPlaces => {
                    const matched = allPlaces.find(p =>
                      p.name === place.name &&
                      Math.abs(parseFloat(p.latitude) - parseFloat(place.latitude)) < 0.00001 &&
                      Math.abs(parseFloat(p.longitude) - parseFloat(place.longitude)) < 0.00001
                    );

                    if (matched) {
                      console.log("🧪 최신 usernames:", matched.usernames);
                      setSelectedPlace({
                        place_name: matched.name,
                        address_name: matched.address,
                        y: matched.latitude,
                        x: matched.longitude,
                        phone: matched.phone,
                        place_url: matched.place_url,
                        usernames: matched.usernames
                          ? matched.usernames.split(',').map(n => n.trim())
                          : []
                      });
                      map.panTo(marker.getPosition());
                    }
                  });
              });


              const markerObj = {
                name: place.name,
                lat: parseFloat(place.latitude),
                lng: parseFloat(place.longitude),
                user_id: place.user_id,
                marker: marker,
                category: place.category,
                phone: place.phone
              };

              setAllMarkers(prev => [...prev, markerObj]);
            });
          });
      });

    window.kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
      const latlng = mouseEvent.latLng;
      map.panTo(latlng);

      if (!userId) {
        const msgBox = document.createElement("div");
        msgBox.innerText = "로그인 후 이용할 수 있는 기능입니다.";
        Object.assign(msgBox.style, {
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#333",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: "8px",
          zIndex: 9999,
          fontSize: "14px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
        });
        document.body.appendChild(msgBox);
        setTimeout(() => msgBox.remove(), 2000);
        return;
      }

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
          const nearest = findNearestPlace(latlng, data);
          if (nearest) {
            setSelectedPlace({
              place_name: nearest.place_name,
              address_name: nearest.address_name,
              y: nearest.y,
              x: nearest.x,
              phone: nearest.phone,
              place_url: nearest.place_url,
              category_group_name: nearest.category_group_name
            });
          }
        }
      }, {
        location: latlng,
        radius: 300,
        sort: window.kakao.maps.services.SortBy.DISTANCE
      });

      places.categorySearch('CE7', (data, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setCafes(data);
          const nearest = findNearestPlace(latlng, data);
          if (!selectedPlace && nearest) {
            setSelectedPlace({
              place_name: nearest.place_name,
              address_name: nearest.address_name,
              y: nearest.y,
              x: nearest.x,
              phone: nearest.phone,
              place_url: nearest.place_url,
              category_group_name: nearest.category_group_name
            });
          }
        }
      }, {
        location: latlng,
        radius: 300,
        sort: window.kakao.maps.services.SortBy.DISTANCE
      });
    });

    fetch(`http://localhost:5000/user/${userId}/location`)
      .then(res => res.json())
      .then(data => {
        const lat = data.latitude ?? 37.55406383694701;
        const lng = data.longitude ?? 126.92058772873095;
        createMarkerAndHandleDrag(lat, lng);
      })
      .catch(() => {
        createMarkerAndHandleDrag(37.55406383694701, 126.92058772873095);
      });

    function createMarkerAndHandleDrag(lat, lng) {
      const userPosition = new window.kakao.maps.LatLng(lat, lng);
      const marker = new window.kakao.maps.Marker({
        position: userPosition,
        draggable: true,
        map: map
      });

      const overlay = new window.kakao.maps.CustomOverlay({
        position: userPosition,
        content: `<div style="background:white;border:1px solid #ccc;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:bold;">내 위치</div>`,
        yAnchor: 3
      });

      overlay.setMap(map);
      map.setCenter(userPosition);

      window.kakao.maps.event.addListener(marker, 'dragend', function () {
        const pos = marker.getPosition();
        overlay.setPosition(pos);

        if (userId) {
          fetch(`http://localhost:5000/user/${userId}/location`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: pos.getLat(),
              longitude: pos.getLng()
            })
          });
        }
      });
    }
  }


  const handlePlaceClick = (place) => {
    setSelectedPlace(place);

    if (mapObj) {
      if (tempMarker) tempMarker.setMap(null);
      if (tempInfoWindow) tempInfoWindow.close();

      const latlng = new window.kakao.maps.LatLng(place.y, place.x);
      const marker = new window.kakao.maps.Marker({
        position: latlng,
        map: mapObj
      });

      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:5px; font-size:13px;">📍 ${place.place_name}</div>`,
        removable: true
      });
      infowindow.open(mapObj, marker);

      setTempMarker(marker);
      setTempInfoWindow(infowindow);
      mapObj.setCenter(latlng);
    }
  };

  const handleAddMarker = () => {
    const user_id = localStorage.getItem("user_id");
    const userName = localStorage.getItem("name");
    if (!user_id) {
      alert("로그인 후에 마커를 추가할 수 있습니다.");
      return;
    }

    if (selectedPlace && mapObj) {
      const latlng = new window.kakao.maps.LatLng(selectedPlace.y, selectedPlace.x);
      const marker = new window.kakao.maps.Marker({
        position: latlng,
        map: mapObj,
      });

      mapObj.setCenter(latlng);

      setMyMarkerObjects(prev => [...prev, { name: selectedPlace.place_name, marker }]);

      window.kakao.maps.event.addListener(marker, 'click', () => {
        setSelectedPlace({
          place_name: selectedPlace.place_name,
          address_name: selectedPlace.address_name,
          y: selectedPlace.y,
          x: selectedPlace.x,
          phone: selectedPlace.phone,
          place_url: selectedPlace.place_url,
          usernames: selectedPlace.usernames
        });
        mapObj.panTo(marker.getPosition());
      });

      setMarkerObj(marker);

      const existing = allMarkers.find(m =>
        m.name === selectedPlace.place_name &&
        Math.abs(m.lat - parseFloat(selectedPlace.y)) < 0.00001 &&
        Math.abs(m.lng - parseFloat(selectedPlace.x)) < 0.00001
      );

      const category = selectedPlace.category_group_name || existing?.category || "미분류";
      const phone = selectedPlace.phone || existing?.phone || "";

      fetch("http://localhost:5000/add_place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedPlace.place_name,
          latitude: selectedPlace.y,
          longitude: selectedPlace.x,
          address: selectedPlace.address_name,
          category: category,
          phone: phone,
          user_id: user_id
        })
      })
        .then(res => res.json())
        .then(data => {
          console.log("✅ DB 저장 완료:", data);



          setAllMarkers(prev => [
            ...prev,
            {
              name: selectedPlace.place_name,
              lat: parseFloat(selectedPlace.y),
              lng: parseFloat(selectedPlace.x),
              user_id: user_id,
              marker: marker,
              category: category,
              phone: phone
            }
          ]);
          setSelectedPlace(prev => {
            const updated = {
              ...prev,
              usernames: Array.isArray(prev.usernames)
                ? [...prev.usernames, userName]
                : [userName]
            };
            console.log("🧪 업데이트된 selectedPlace.usernames:", updated.usernames);
            return updated;
          });

        })
        .catch(err => {
          console.error("❌ DB 저장 실패:", err);
        });
    }
  };

  function findNearestPlace(clickedLatLng, places) {
    let minDist = Infinity;
    let nearest = null;

    for (const place of places) {
      const dx = clickedLatLng.getLat() - parseFloat(place.y);
      const dy = clickedLatLng.getLng() - parseFloat(place.x);
      const dist = dx * dx + dy * dy;

      if (dist < minDist) {
        minDist = dist;
        nearest = place;
      }
    }

    return nearest;
  }

  const handleMoveToMyLocation = () => {
    const userId = localStorage.getItem("user_id");
    if (!mapObj || !userId) return;

    fetch(`http://localhost:5000/user/${userId}/location`)
      .then(res => res.json())
      .then(data => {
        if (data.latitude != null && data.longitude != null) {
          const userLatLng = new window.kakao.maps.LatLng(data.latitude, data.longitude);
          mapObj.panTo(userLatLng);
        } else {
          alert("저장된 위치 정보가 없습니다.");
        }
      })
      .catch(err => {
        console.error("위치 정보 불러오기 실패:", err);
      });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <div
        id="map"
        style={{
          position: "relative",
          width: "800px",
          height: "500px",
          border: "1px solid #ccc",
          borderRadius: "10px",
          marginTop: "20px"
        }}
      >
        <button
          onClick={handleMoveToMyLocation}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '10px',
            zIndex: 1000,
            padding: '10px 16px',
            backgroundColor: '#3182f6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
          }}
        >
          📍 내 위치로 이동
        </button>
      </div>

      {address && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '20px',
          marginTop: '20px',
          width: '100%',
          maxWidth: '800px'
        }}>
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
          <div style={{ width: '1px', backgroundColor: '#ccc' }}></div>
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
          {selectedPlace.usernames && (
            <p>👥 등록한 사용자: {Array.isArray(selectedPlace.usernames)
              ? selectedPlace.usernames.join(', ')
              : selectedPlace.usernames}</p>
          )}

          <a
            href={
              selectedPlace.place_url
                ? selectedPlace.place_url
                : `https://map.kakao.com/link/search/${encodeURIComponent(selectedPlace.place_name)}`
            }
            target="_blank"
            rel="noreferrer"
          >
            지도에서 보기
          </a>
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
