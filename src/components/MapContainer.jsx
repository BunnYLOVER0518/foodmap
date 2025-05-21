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

          // ✅ 공통 클릭 이벤트 적용
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

              // ✅ 공통 클릭 이벤트 적용
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
      if (tempMarkerRef.current) {
        tempMarkerRef.current.setMap(null);
        tempMarkerRef.current = null;
      }

      // ✅ 이전 페이드 타이머 중지
      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }

      if (tempInfoWindow) {
        tempInfoWindow.close();
        setTempInfoWindow(null);
      }

      const latlng = new window.kakao.maps.LatLng(place.y, place.x);
      const marker = new window.kakao.maps.Marker({
        position: latlng,
        map: mapObj
      });

      // ✅ useRef에 직접 저장
      tempMarkerRef.current = marker;
      setTempMarker(marker); // 필요하면 유지

      mapObj.panTo(latlng);
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

            // ✅ 중심 이동 추가
            if (mapObj) {
              const latlng = new window.kakao.maps.LatLng(
                parseFloat(matched.latitude),
                parseFloat(matched.longitude)
              );
              mapObj.panTo(latlng);

            }
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
  /*
    const handleSearch = () => {
      if (!searchKeyword.trim()) return;
  
      const ps = new window.kakao.maps.services.Places();
      ps.keywordSearch(searchKeyword, (data, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setSearchResults(data);
        } else {
          setSearchResults([]);
        }
      });
    };
  */

  return (
    <div style={{
      display: "flex",
      justifyContent: "center", // 전체 화면에서 중앙 정렬
      width: "100%",
    }}>
      {/* 전체 콘텐츠 컨테이너 */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        maxWidth: "1200px", // 전체 폭 고정
        width: "100%"
      }}>



        {/* ✅ 오른쪽 지도 + 음식점/카페 리스트 + 모달 */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          margin: "0 auto"
        }}>
          {/* 지도 */}
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

          {/* 음식점 / 카페 리스트 */}
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
    </div>
  );


};

export default MapContainer;
