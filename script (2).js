const API_KEY = "263abc93edd1a3e3827536db7ec85a8a98c13dca847dd5215476936dadcf55d1";

let map;

function getDistance(lat1,lng1,lat2,lng2){

    const R = 6371;

    const dLat = (lat2-lat1) * Math.PI/180;
    const dLng = (lng2-lng1) * Math.PI/180;

    const a =
        Math.sin(dLat/2) ** 2 +
        Math.cos(lat1*Math.PI/180) *
        Math.cos(lat2*Math.PI/180) *
        Math.sin(dLng/2) ** 2;

    return R * 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1-a)
    );
}

async function loadTrashLocations(myLat,myLng){

    const url =
    `https://api.odcloud.kr/api/15109940/v1/uddi:40b6d42c-3216-4612-b86a-ba8effce8c11?page=1&perPage=500&serviceKey=${API_KEY}`;

    const response = await fetch(url);
    const result = await response.json();

    let nearest = null;
    let minDistance = Infinity;

    result.data.forEach(place=>{

        if(!place.위도 || !place.경도) return;

        const lat = parseFloat(place.위도);
        const lng = parseFloat(place.경도);

        const marker = new kakao.maps.Marker({
            map:map,
            position:new kakao.maps.LatLng(lat,lng)
        });

        const infoWindow =
            new kakao.maps.InfoWindow({
                content:
                `
                <div style="padding:8px;">
                    <b>${place.상세주소 || "배출장소"}</b><br>
                    일반쓰레기 :
                    ${place.일반쓰레기배출요일 || "-"}
                    <br>
                    재활용품 :
                    ${place.재활용품배출요일 || "-"}
                </div>
                `
            });

        kakao.maps.event.addListener(
            marker,
            'click',
            function(){
                infoWindow.open(map, marker);
            }
        );

        const distance =
            getDistance(
                myLat,
                myLng,
                lat,
                lng
            );

        if(distance < minDistance){

            minDistance = distance;
            nearest = place;

        }

    });

    if(nearest){

        document.getElementById(
            "nearestInfo"
        ).innerHTML =
        `
        <h2>📍 가장 가까운 배출장소</h2>

        <p>
        ${nearest.상세주소}
        </p>

        <p>
        거리 :
        ${(minDistance*1000).toFixed(0)}m
        </p>

        <p>
        일반쓰레기 :
        ${nearest.일반쓰레기배출요일 || "-"}
        </p>

        <p>
        재활용품 :
        ${nearest.재활용품배출요일 || "-"}
        </p>

        <a
        target="_blank"
        href="https://map.kakao.com/link/to/${encodeURIComponent(nearest.상세주소)},${nearest.위도},${nearest.경도}">
        🗺️ 길찾기
        </a>
        `;
    }
}

function findMyLocation(){

    navigator.geolocation.getCurrentPosition(
        function(position){

            const myLat =
                position.coords.latitude;

            const myLng =
                position.coords.longitude;

            map = new kakao.maps.Map(
                document.getElementById("map"),
                {
                    center:
                    new kakao.maps.LatLng(
                        myLat,
                        myLng
                    ),
                    level:4
                }
            );

            new kakao.maps.Marker({
                map:map,
                position:
                new kakao.maps.LatLng(
                    myLat,
                    myLng
                )
            });

            loadTrashLocations(
                myLat,
                myLng
            );

        },

        function(){

            alert(
                "위치 정보를 가져올 수 없습니다."
            );

        }
    );
}