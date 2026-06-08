// 공공데이터포털 일반 인증키 (Encoding 형태 권장)
const API_KEY = "263abc93edd1a3e3827536db7ec85a8a98c13dca847dd5215476936dadcf55d1";

let map;

// 하버사인(Haversine) 공식을 이용한 두 좌표 간의 거리 계산 (단위: km)
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 공공데이터 API로부터 쓰레기 배출장소 로드 및 마커 표시
async function loadTrashLocations(myLat, myLng) {
    // ⚠️ serviceKey 부분에 encodeURIComponent를 적용하여 인증 오류를 방지합니다.
    const url = `https://api.odcloud.kr/api/15109940/v1/uddi:40b6d42c-3216-4612-b86a-ba8effce8c11?page=1&perPage=500&serviceKey=${encodeURIComponent(API_KEY)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("데이터를 불러오는 데 실패했습니다.");
        }
        
        const result = await response.json();

        let nearest = null;
        let minDistance = Infinity;

        // 공공데이터 데이터 배열 순회
        result.data.forEach(place => {
            // 위도, 경도 데이터가 없는 경우 예외 처리
            if (!place.위도 || !place.경도) return;

            const lat = parseFloat(place.위도);
            const lng = parseFloat(place.경도);

            // 1. 카카오맵에 배출장소 마커 생성
            const marker = new kakao.maps.Marker({
                map: map,
                position: new kakao.maps.LatLng(lat, lng)
            });

            // 2. 마커 클릭 시 나타날 인포윈도우 생성
            const infoWindow = new kakao.maps.InfoWindow({
                content: `
                    <div style="padding:10px; min-width:200px; font-size:14px; line-height:1.5;">
                        <b style="font-size:15px; color:#2c3e50;">${place.상세주소 || "배출장소"}</b><br>
                        <hr style="margin:5px 0; border:0; border-top:1px solid #eee;">
                        일반쓰레기: ${place.일반쓰레기배출요일 || "-"}<br>
                        재활용품: ${place.재활용품배출요일 || "-"}
                    </div>
                `
            });

            // 마커 클릭 이벤트 등록
            kakao.maps.event.addListener(marker, 'click', function() {
                infoWindow.open(map, marker);
            });

            // 3. 내 위치와 해당 배출장소 간의 거리 계산
            const distance = getDistance(myLat, myLng, lat, lng);

            if (distance < minDistance) {
                minDistance = distance;
                nearest = place;
            }
        });

        // 가장 가까운 배출장소 정보를 HTML에 반영
        if (nearest) {
            document.getElementById("nearestInfo").innerHTML = `
                <h2>📍 가장 가까운 배출장소</h2>
                <p><strong>주소:</strong> ${nearest.상세주소}</p>
                <p><strong>거리:</strong> ${(minDistance * 1000).toFixed(0)}m 이내</p>
                <p><strong>일반쓰레기:</strong> ${nearest.일반쓰레기배출요일 || "-"}</p>
                <p><strong>재활용품:</strong> ${nearest.재활용품배출요일 || "-"}</p>
                <a target="_blank" class="route-btn"
                   href="https://map.kakao.com/link/to/${encodeURIComponent(nearest.상세주소)},${nearest.위도},${nearest.경도}">
                   🗺️ 카카오맵으로 길찾기
                </a>
            `;
        } else {
            document.getElementById("nearestInfo").innerText = "주변에 배출장소 데이터가 없습니다.";
        }

    } catch (error) {
        console.error(error);
        alert("배출장소 데이터를 가져오는 중 오류가 발생했습니다.");
    }
}

// 사용자의 현재 위치를 구하는 함수
function findMyLocation() {
    if (!navigator.geolocation) {
        alert("이 브라우저에서는 위치 서비스를 지원하지 않습니다.");
        return;
    }

    document.getElementById("nearestInfo").innerText = "🔄 내 위치를 계산하고 데이터를 불러오는 중...";

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const myLat = position.coords.latitude;
            const myLng = position.coords.longitude;

            // 지도 생성 및 현재 내 위치를 중심으로 설정
            map = new kakao.maps.Map(document.getElementById("map"), {
                center: new kakao.maps.LatLng(myLat, myLng),
                level: 4
            });

            // 내 위치에 커스텀 마커 혹은 기본 마커 표시
            new kakao.maps.Marker({
                map: map,
                position: new kakao.maps.LatLng(myLat, myLng)
            });

            // 공공데이터 연동 호출
            loadTrashLocations(myLat, myLng);
        },
        function(error) {
            console.error(error);
            alert("위치 정보를 가져올 수 없습니다. 브라우저의 위치 권한을 확인해 주세요.");
            document.getElementById("nearestInfo").innerText = "위치 조회 실패";
        }
    );
}
