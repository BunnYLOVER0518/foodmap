import { useEffect, useState, useRef } from "react";

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
  const tempMarkerRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [useDistanceFilter, setUseDistanceFilter] = useState(false);


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

        // 내 마커 목록에서 제거
        setMyMarkers(prev => {
          const updated = prev.filter(m => m.name !== selectedPlace.place_name);
          console.log("🧹 마커 상태에서 제거됨:", updated);
          return updated;
        });

        // 🔄 최신 usernames 확인
        fetch("http://localhost:5000/places")
          .then(res => res.json())
          .then(allPlaces => {
            const matched = allPlaces.find(p =>
              p.name === selectedPlace.place_name &&
              Math.abs(parseFloat(p.latitude) - parseFloat(selectedPlace.y)) < 0.00001 &&
              Math.abs(parseFloat(p.longitude) - parseFloat(selectedPlace.x)) < 0.00001
            );

            const usernamesLeft = matched?.usernames?.split(',').map(n => n.trim()).filter(Boolean) ?? [];

            if (usernamesLeft.length === 0) {
              // 아무도 없으면 마커 완전 삭제
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

                  return !match; // 제거 대상은 제외
                });

                return updated;
              });
            } else {
              console.log("❗다른 사용자들이 남아 있으므로 마커 유지:", usernamesLeft);

              // ✅ 내 마커만 제거
              setAllMarkers(prev => {
                return prev.filter(m =>
                  !(
                    m.name === selectedPlace.place_name &&
                    m.user_id === user_id &&
                    Math.abs(m.lat - parseFloat(selectedPlace.y)) < 0.00001 &&
                    Math.abs(m.lng - parseFloat(selectedPlace.x)) < 0.00001
                  )
                );
              });
            }

            // ✅ 버튼 전환을 위해 selectedPlace 갱신
            setSelectedPlace(prev => {
              if (!matched) return null;
              return { ...prev, usernames: usernamesLeft };
            });
          });
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
      level: 2,
    });

    const zoomControl = new window.kakao.maps.ZoomControl();
    map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

    setMapObj(map); // ✅ mapObj 먼저 설정

    // ✅ 마커 fetch 로직은 setTimeout(0)으로 밀어서 mapObj 설정 이후에 실행
    setTimeout(() => {
      const isCloseEnough = (a, b) => Math.abs(a - b) < 0.00001;

      fetch(`http://localhost:5000/user/${userId}/places`)
        .then(res => res.json())
        .then(userPlaces => {
          const myMarkers = userPlaces.map(place => {
            const pos = new window.kakao.maps.LatLng(place.latitude, place.longitude);
            const marker = new window.kakao.maps.Marker({ position: pos, map });

            attachClickEventToMarker(marker, {
              name: place.name,
              latitude: place.latitude,
              longitude: place.longitude
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

                attachClickEventToMarker(marker, {
                  name: place.name,
                  latitude: place.latitude,
                  longitude: place.longitude
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
    }, 0); // ⏱ 비동기적으로 mapObj 설정 이후에 실행되도록 보장

    // ✅ 지도 클릭 이벤트 (그대로 유지)
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

      // 음식점
      places.categorySearch('FD6', (data, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setRestaurants(data);
          const nearest = findNearestPlace(latlng, data);
          if (nearest) {
            fetch(`http://localhost:5000/user/${userId}/location`)
              .then(res => res.json())
              .then(pos => {
                const dist = getDistance(pos.latitude, pos.longitude, parseFloat(nearest.y), parseFloat(nearest.x));
                setSelectedPlace({
                  place_name: nearest.place_name,
                  address_name: nearest.address_name,
                  y: nearest.y,
                  x: nearest.x,
                  phone: nearest.phone,
                  place_url: nearest.place_url,
                  category_group_name: nearest.category_group_name,
                  distance: Math.round(dist)
                });
              });
          }
        }
      }, {
        location: latlng,
        radius: 300,
        sort: window.kakao.maps.services.SortBy.DISTANCE
      });

      // 카페
      places.categorySearch('CE7', (data, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setCafes(data);
          const nearest = findNearestPlace(latlng, data);
          if (!selectedPlace && nearest) {
            fetch(`http://localhost:5000/user/${userId}/location`)
              .then(res => res.json())
              .then(pos => {
                const dist = getDistance(pos.latitude, pos.longitude, parseFloat(nearest.y), parseFloat(nearest.x));
                setSelectedPlace({
                  place_name: nearest.place_name,
                  address_name: nearest.address_name,
                  y: nearest.y,
                  x: nearest.x,
                  phone: nearest.phone,
                  place_url: nearest.place_url,
                  category_group_name: nearest.category_group_name,
                  distance: Math.round(dist)
                });
              });
          }
        }
      }, {
        location: latlng,
        radius: 300,
        sort: window.kakao.maps.services.SortBy.DISTANCE
      });
    });

    // 내 위치 마커
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



  const handlePlaceClick = (place, fromSearchList = false) => {
    const userId = localStorage.getItem("user_id");

    fetch(`http://localhost:5000/user/${userId}/location`)
      .then(res => res.json())
      .then(pos => {
        const userLat = pos.latitude;
        const userLng = pos.longitude;

        const lat = parseFloat(place.y);
        const lng = parseFloat(place.x);
        const distance = getDistance(userLat, userLng, lat, lng);

        setSelectedPlace({
          ...place,
          distance: Math.round(distance) // ✅ 거리 포함
        });

        if (mapObj) {
          if (tempMarkerRef.current) {
            tempMarkerRef.current.setMap(null);
            tempMarkerRef.current = null;
          }

          if (fadeTimerRef.current) {
            clearInterval(fadeTimerRef.current);
            fadeTimerRef.current = null;
          }

          if (tempInfoWindow) {
            tempInfoWindow.close();
            setTempInfoWindow(null);
          }

          const latlng = new window.kakao.maps.LatLng(lat, lng);

          const markerImage = fromSearchList
            ? new window.kakao.maps.MarkerImage(
              "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
              new window.kakao.maps.Size(24, 35)
            )
            : undefined;

          const marker = new window.kakao.maps.Marker({
            position: latlng,
            map: mapObj,
            image: markerImage
          });

          tempMarkerRef.current = marker;
          setTempMarker(marker);
          mapObj.panTo(latlng);
        }
      });
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
      setMarkerObj(marker);

      // ✅ 공통 마커 클릭 이벤트 등록
      attachClickEventToMarker(marker, {
        name: selectedPlace.place_name,
        latitude: selectedPlace.y,
        longitude: selectedPlace.x
      });

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

          // 🔄 usernames 재조회
          fetch("http://localhost:5000/places")
            .then(res => res.json())
            .then(allPlaces => {
              const matched = allPlaces.find(p =>
                p.name === selectedPlace.place_name &&
                Math.abs(parseFloat(p.latitude) - parseFloat(selectedPlace.y)) < 0.00001 &&
                Math.abs(parseFloat(p.longitude) - parseFloat(selectedPlace.x)) < 0.00001
              );

              if (matched) {
                setSelectedPlace(prev => ({
                  ...prev,
                  usernames: matched.usernames
                    ? matched.usernames.split(',').map(n => n.trim())
                    : []
                }));
                console.log("🧪 usernames 최신화 완료:", matched.usernames);
              }
            });
        })
        .catch(err => {
          console.error("❌ DB 저장 실패:", err);
        });
    }
  };

  const attachClickEventToMarker = (marker, place) => {
    window.kakao.maps.event.addListener(marker, 'click', () => {
      const userId = localStorage.getItem("user_id");

      const lat = parseFloat(place.latitude || place.lat);
      const lng = parseFloat(place.longitude || place.lng);
      console.log("🧭 클릭된 마커 위치:", place.name, lat, lng);
      console.log("🗺 mapObj 상태:", mapObj);

      if (mapObj && !isNaN(lat) && !isNaN(lng)) {
        const latlng = new window.kakao.maps.LatLng(lat, lng);
        mapObj.panTo(latlng);
      } else {
        console.warn("❌ 좌표 정보가 잘못되어 중심 이동 실패:", lat, lng);
      }

      fetch("http://localhost:5000/places")
        .then(res => res.json())
        .then(allPlaces => {
          const matched = allPlaces.find(p =>
            p.name === place.name &&
            Math.abs(parseFloat(p.latitude) - lat) < 0.00001 &&
            Math.abs(parseFloat(p.longitude) - lng) < 0.00001
          );

          if (matched) {
            fetch(`http://localhost:5000/user/${userId}/location`)
              .then(res => res.json())
              .then(pos => {
                const dist = getDistance(
                  pos.latitude,
                  pos.longitude,
                  parseFloat(matched.latitude),
                  parseFloat(matched.longitude)
                );

                setSelectedPlace({
                  place_name: matched.name,
                  address_name: matched.address,
                  y: parseFloat(matched.latitude),
                  x: parseFloat(matched.longitude),
                  phone: matched.phone,
                  place_url: matched.place_url,
                  usernames: matched.usernames
                    ? matched.usernames.split(',').map(n => n.trim())
                    : [],
                  distance: Math.round(dist)
                });
              });
          }
        });
    });
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

  const handleSearch = () => {
    if (!searchKeyword.trim()) return;

    const userId = localStorage.getItem("user_id");

    fetch(`http://localhost:5000/user/${userId}/location`)
      .then(res => res.json())
      .then(pos => {
        const userLat = pos.latitude;
        const userLng = pos.longitude;
        const userPosition = new window.kakao.maps.LatLng(userLat, userLng);

        const ps = new window.kakao.maps.services.Places();

        ps.keywordSearch(searchKeyword, (data, status) => {
          if (status !== window.kakao.maps.services.Status.OK || data.length === 0) {
            setSearchResults([]);
            return;
          }

          // 음식점/카페만 필터링
          let filtered = data.filter(
            (p) => p.category_group_code === "FD6" || p.category_group_code === "CE7"
          );

          // 거리 계산 후 정렬
          filtered = filtered.map(p => ({
            ...p,
            distance: getDistance(userLat, userLng, parseFloat(p.y), parseFloat(p.x))
          })).sort((a, b) => a.distance - b.distance);

          // 거리 제한 필터
          if (useDistanceFilter) {
            filtered = filtered.filter(p => p.distance <= 1000);
          }

          setSearchResults(filtered);

          // 가장 가까운 장소 자동 선택
          if (filtered.length > 0) {
            const exactMatch = filtered.find(p =>
              p.place_name.toLowerCase().includes(searchKeyword.toLowerCase())
            );
            handlePlaceClick(exactMatch || filtered[0]);
          }
        }, {
          location: userPosition, // ✅ DB에서 가져온 위치 기준
        });
      })
      .catch(() => {
        alert("위치 정보를 불러오지 못했습니다.");
      });
  };




  function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = x => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }


  return (
    <div style={{ display: "flex", width: "100%" }}>
      {/* 좌측: 검색창 + 결과 목록 */}
      <div style={{ flex: 1, padding: "20px", borderRight: "1px solid #ccc" }}>
        <div style={{ margin: "10px 0" }}>
          <label style={{ fontSize: "14px" }}>
            <input
              type="checkbox"
              checked={useDistanceFilter}
              onChange={(e) => setUseDistanceFilter(e.target.checked)}
              style={{ marginRight: "6px" }}
            />
            내 위치 기준 반경 1km 이내만 보기
          </label>
        </div>
        <h3>🔍 장소 또는 가게 검색</h3>
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="예: 스타벅스, 홍대입구역"
          style={{
            width: "95%",
            padding: "10px",
            fontSize: "16px",
            marginBottom: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            width: "100%",
            padding: "10px",
            fontWeight: "bold",
            border: "none",
            borderRadius: "6px",
            backgroundColor: "#3182f6",
            color: "white",
            cursor: "pointer"
          }}
        >
          검색
        </button>

        <ul style={{ listStyle: "none", padding: 0, marginTop: "20px" }}>
          {searchResults.map((place, index) => (
            <li key={index} style={{ marginBottom: "10px" }}>
              <button
                onClick={() => handlePlaceClick(place)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  color: "#007aff",
                  fontWeight: "bold"
                }}
              >
                {place.place_name}
                <br />
                <span style={{ fontSize: "12px", color: "#555" }}>
                  {place.address_name}
                </span>
                {place.distance != null && (
                  <div style={{ fontSize: "12px", color: "#888" }}>
                    📍 거리: {Math.round(place.distance)}m
                  </div>
                )}
              </button>
            </li>
          ))}

        </ul>
      </div>

      {/* 우측: 지도 + 음식점/카페 리스트 + 모달 */}
      <div style={{ flex: 3, display: "flex", flexDirection: "column", alignItems: "center", padding: "20px" }}>
        <div
          id="map"
          style={{
            width: "100%",
            height: "700px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            marginBottom: "20px"
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

        {/* 음식점 / 카페 리스트 */}
        {address && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '20px',
            width: '100%'
          }}>
            <div style={{ flex: 1 }}>
              <h4>🍽 음식점</h4>
              <ul style={{ listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
                {restaurants.map((place, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handlePlaceClick(place, true)}
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
                      onClick={() => handlePlaceClick(place, true)}
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

        {/* 마커 정보 모달 */}
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
            {selectedPlace.distance != null && (
              <p>📏 내 위치와의 거리: {selectedPlace.distance}m</p>
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
              <button
                onClick={() => {
                  if (tempInfoWindow) {
                    tempInfoWindow.close();
                    setTempInfoWindow(null);
                  }

                  if (tempMarkerRef.current) {
                    let opacity = 1.0;
                    if (fadeTimerRef.current) {
                      clearInterval(fadeTimerRef.current);
                    }
                    fadeTimerRef.current = setInterval(() => {
                      if (!tempMarkerRef.current) {
                        clearInterval(fadeTimerRef.current);
                        fadeTimerRef.current = null;
                        return;
                      }

                      opacity -= 0.02;
                      if (opacity <= 0) {
                        tempMarkerRef.current.setMap(null);
                        tempMarkerRef.current = null;
                        clearInterval(fadeTimerRef.current);
                        fadeTimerRef.current = null;
                      } else {
                        tempMarkerRef.current.setOpacity(opacity);
                      }
                    }, 50);
                  }

                  setTempMarker(null);
                  setSelectedPlace(null);
                }}
              >
                닫기
              </button>
              {!isMyMarker ? (
                <button onClick={handleAddMarker}>마커 추가</button>
              ) : (
                <button onClick={handleDeleteMarker}>마커 삭제</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );


};

export default MapContainer;
