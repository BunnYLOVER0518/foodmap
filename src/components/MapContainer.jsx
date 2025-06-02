import { useEffect, useState, useRef } from "react";

const MapContainer = () => {
  const [address, setAddress] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [cafes, setCafes] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapObj, setMapObj] = useState(null);
  //const [markerObj, setMarkerObj] = useState(null);
  const mapRef = useRef(null);
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

        setMyMarkers(prev => {
          const updated = prev.filter(m => m.name !== selectedPlace.place_name);
          return updated;
        });

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
              setAllMarkers(prev => {
                const isCloseEnough = (a, b) => Math.abs(a - b) < 0.00001;

                const updated = prev.filter(m => {
                  const match =
                    m.name === selectedPlace.place_name &&
                    isCloseEnough(m.lat, parseFloat(selectedPlace.y)) &&
                    isCloseEnough(m.lng, parseFloat(selectedPlace.x));

                  if (match) {
                    m.marker.setMap(null);
                  }

                  return !match;
                });

                return updated;
              });
            } else {
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

            setSelectedPlace(prev => {
              if (!matched) return null;

              const updated = { ...prev, usernames: usernamesLeft };

              const placeId = matched.id;
              if (placeId) {
                fetch(`http://localhost:5000/place/rating?place_id=${placeId}`)
                  .then(res => res.json())
                  .then(ratingData => {
                    setSelectedPlace(prev => ({
                      ...prev,
                      usernames: usernamesLeft,
                      place_rating: ratingData.rating,
                      place_review_count: ratingData.count
                    }));
                  });
              }

              return updated;
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

    mapRef.current = map;

    const zoomControl = new window.kakao.maps.ZoomControl();
    map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

    setMapObj(map);

    setTimeout(() => {
      const isCloseEnough = (a, b) => Math.abs(a - b) < 0.00001;

      fetch(`http://localhost:5000/user/${userId}/places`)
        .then(res => res.json())
        .then(userPlaces => {
          const myMarkers = userPlaces.map(place => {
            const pos = new window.kakao.maps.LatLng(place.latitude, place.longitude);
            const marker = new window.kakao.maps.Marker({ position: pos, map });

            attachClickEventToMarker(marker, {
              id: place.id,
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
              phone: place.phone,
              usernames: place.usernames
                ? place.usernames.split(',').map(n => n.trim())
                : []
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
                  id: place.id,
                  name: place.name,
                  latitude: place.latitude,
                  longitude: place.longitude
                });

                const markerObj = {
                  name: place.name,
                  id: place.id,
                  lat: parseFloat(place.latitude),
                  lng: parseFloat(place.longitude),
                  user_id: place.user_id,
                  marker: marker,
                  category: place.category,
                  phone: place.phone,
                  usernames: place.usernames
                    ? place.usernames.split(',').map(n => n.trim())
                    : []
                };

                setAllMarkers(prev => [...prev, markerObj]);
              });
            });
        });
    }, 0);

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

        const placeId = place.id || place.place_id;
        if (!placeId) {
          return;
        }

        const selected = {
          ...place,
          distance: Math.round(distance),
          id: placeId
        };
        setSelectedPlace(selected);

        if (!fromSearchList) {
          fetch(`http://localhost:5000/place/rating?place_id=${placeId}`)
            .then(res => res.json())
            .then(ratingData => {
              setSelectedPlace(prev => ({
                ...prev,
                place_rating: ratingData.rating,
                place_review_count: ratingData.count
              }));
            });
        }

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

      attachClickEventToMarker(marker, {
        id: selectedPlace.id,
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
              }
            });
        })
        .catch(err => {
        });
    }
  };

  const attachClickEventToMarker = (marker, place) => {
    window.kakao.maps.event.addListener(marker, 'click', () => {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        showLoginRequiredMessage();
        return;
      }
      const lat = parseFloat(place.latitude ?? place.lat);
      const lng = parseFloat(place.longitude ?? place.lng);
      const map = mapRef.current;

      if (!map || isNaN(lat) || isNaN(lng)) {
        return;
      }

      const latlng = new window.kakao.maps.LatLng(lat, lng);
      map.panTo(latlng);

      fetch("http://localhost:5000/places")
        .then(res => res.json())
        .then(allPlaces => {
          const matched = allPlaces.find(p =>
            p.name === place.name &&
            Math.abs(parseFloat(p.latitude) - lat) < 0.00001 &&
            Math.abs(parseFloat(p.longitude) - lng) < 0.00001
          );

          if (!matched) {
            return;
          }

          const placeId = matched.id || matched.place_id;
          if (!placeId) {
            return;
          }

          fetch(`http://localhost:5000/user/${userId}/location`)
            .then(res => res.json())
            .then(pos => {
              const dist = getDistance(
                pos.latitude,
                pos.longitude,
                parseFloat(matched.latitude),
                parseFloat(matched.longitude)
              );

              fetch(`http://localhost:5000/place/rating?place_id=${placeId}`)
                .then(res => res.json())
                .then(ratingData => {
                  const selected = {
                    place_name: matched.name,
                    address_name: matched.address,
                    y: parseFloat(matched.latitude),
                    x: parseFloat(matched.longitude),
                    phone: matched.phone,
                    place_url: matched.place_url,
                    usernames: matched.usernames
                      ? matched.usernames.split(',').map(n => n.trim())
                      : [],
                    distance: Math.round(dist),
                    place_rating: ratingData.rating,
                    place_review_count: ratingData.count
                  };
                  setSelectedPlace(selected);
                });
            });
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
    if (!mapObj) return; 

    fetch(`http://localhost:5000/user/${userId}/location`)
      .then(res => res.json())
      .then(data => {
        const lat = data.latitude ?? 37.55406383694701;
        const lng = data.longitude ?? 126.92058772873095;
        const userLatLng = new window.kakao.maps.LatLng(lat, lng);
        mapObj.panTo(userLatLng);
      })
      .catch(() => {
        const defaultLatLng = new window.kakao.maps.LatLng(37.55406383694701, 126.92058772873095);
        mapObj.panTo(defaultLatLng);
      });
  };

  const handleSearch = () => {
    if (!searchKeyword.trim()) return;

    const userId = localStorage.getItem("user_id");
    if (!userId) {
      showLoginRequiredMessage();
      return;
    }

    if (!searchKeyword.trim()) return;

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

          let filtered = data.filter(
            (p) => p.category_group_code === "FD6" || p.category_group_code === "CE7"
          );

          filtered = filtered.map(p => ({
            ...p,
            distance: getDistance(userLat, userLng, parseFloat(p.y), parseFloat(p.x))
          })).sort((a, b) => a.distance - b.distance);

          if (useDistanceFilter) {
            filtered = filtered.filter(p => p.distance <= 1000);
          }

          setSearchResults(filtered);

          if (filtered.length > 0) {
            const exactMatch = filtered.find(p =>
              p.place_name.toLowerCase().includes(searchKeyword.toLowerCase())
            );
            handlePlaceClick(exactMatch || filtered[0], true);
          }
        }, {
          location: userPosition,
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

  function showLoginRequiredMessage() {
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
  }

  return (
    <div style={{ display: "flex", width: "100%" }}>
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
                onClick={() => handlePlaceClick(place, true)}
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
              <p>
                👥 등록한 사용자:{" "}
                {Array.isArray(selectedPlace.usernames)
                  ? selectedPlace.usernames.map((name, idx) => (
                    <span key={idx}>
                      <a
                        href={`/user/${name}`}
                        style={{ color: "#007aff", textDecoration: "underline", cursor: "pointer" }}
                      >
                        {name}
                      </a>
                      {idx < selectedPlace.usernames.length - 1 && ", "}
                    </span>
                  ))
                  : selectedPlace.usernames}
              </p>
            )}

            {selectedPlace.distance != null && (
              <p>📏 내 위치와의 거리: {selectedPlace.distance}m</p>
            )}

            {selectedPlace.place_rating !== undefined && (
              <p>
                ⭐ 평점:{" "}
                {selectedPlace.place_rating !== null
                  ? `${selectedPlace.place_rating} / 5.0 (${selectedPlace.place_review_count}개)`
                  : "리뷰 없음"}
              </p>
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
