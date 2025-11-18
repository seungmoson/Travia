import React, { 
    createContext, 
    useState, 
    useEffect, 
    useContext,
    useRef,
    useCallback //  useCallback
} from 'react';

const KAKAO_MAP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY;
const KAKAO_SCRIPT_ID = 'kakao-maps-sdk-script';

// 1. Context 생성
export const MapContext = createContext(null);

/**
 * 카카오맵 스크립트를 로드하고, 생성된 map 객체를 Context로 제공하는 Provider
 */
function MapProvider({ children }) {
    const [kakaoMap, setKakaoMap] = useState(null);
    const mapContainerRef = useRef(null);
    
    // SDK 로딩 상태 관리
    const sdkLoadingStatus = useRef({
        isLoading: false,
        isLoaded: false,
    });

    // --- ▼ [오류 수정] ---
    // loadMap 함수를 useEffect 밖으로 이동시키고 useCallback으로 감싸서
    // ReferenceError를 해결하고, 의존성 배열에 안정적으로 전달합니다.
    const loadMap = useCallback(() => {
        if (!mapContainerRef.current) {
            console.error("Map container ref is not available.");
            return;
        }

        try {
            const options = {
                center: new window.kakao.maps.LatLng(35.1795543, 129.0756416), 
                level: 11, 
            };
            const map = new window.kakao.maps.Map(mapContainerRef.current, options);
            setKakaoMap(map); // state에 맵 객체 저장
            console.log("MapProvider successfully created and set kakaoMap state.");
        } catch (e) {
            console.error("Failed to create Kakao Map object:", e);
        }
    }, []); // ref와 setter만 사용하므로 빈 배열
    // --- ▲ [오류 수정] ---


    useEffect(() => {
        if (!KAKAO_MAP_KEY) {
            console.error("Kakao Map API Key is not loaded.");
            return;
        }

        if (sdkLoadingStatus.current.isLoaded || sdkLoadingStatus.current.isLoading) {
            console.log("SDK is already loaded or is currently loading.");
            //  만약 이미 로드되었다면, loadMap을 다시 호출해줘야 맵이 생성됨
            if (sdkLoadingStatus.current.isLoaded) {
                 loadMap();
            }
            return;
        }

        let script = document.getElementById(KAKAO_SCRIPT_ID);

        if (script) {
            if (window.kakao && window.kakao.maps) {
                console.log("SDK script tag found and window.kakao exists.");
                sdkLoadingStatus.current.isLoaded = true;
                loadMap(); //  이제 loadMap이 정의된 상태에서 호출됨
                return;
            }
            console.log("SDK script tag found, but loading... attaching events.");
        } else {
            script = document.createElement('script');
            script.id = KAKAO_SCRIPT_ID;
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false&libraries=services,clusterer,drawing`;
            script.async = true;
            document.head.appendChild(script);
            console.log("Appending new Kakao Maps script...");
        }

        sdkLoadingStatus.current.isLoading = true;
        
        script.onload = () => {
            console.log("Kakao Maps script loaded successfully.");
            window.kakao.maps.load(() => {
                console.log("Kakao Maps libraries initialized.");
                sdkLoadingStatus.current.isLoading = false;
                sdkLoadingStatus.current.isLoaded = true;
                loadMap(); //  이제 loadMap이 정의된 상태에서 호출됨
            });
        };

        script.onerror = () => {
            console.error("Failed to load Kakao Maps script.");
            sdkLoadingStatus.current.isLoading = false;
        };

    }, [loadMap]); //  의존성 배열에 loadMap 추가

    return (
        <MapContext.Provider value={{ kakaoMap }}>
            {/*  맵의 크기를 100vw/100vh -> 부모의 100%로 변경 */}
            <div 
                ref={mapContainerRef} 
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    position: 'relative'
                }}
            >
                {kakaoMap ? children : <div>Loading Map...</div>}
            </div>
        </MapContext.Provider>
    );
}

// --- ▼ [오류 수정] ---
// 실수로 삭제되었던 useMap 훅을 다시 추가합니다.
export function useMap() {
  const context = useContext(MapContext);

  if (!context) {
    throw new Error("useMap must be used within a MapProvider.");
  }
  
  // value={{ kakaoMap }}을 전달했으므로, context는 { kakaoMap } 객체
  return context; 
}
// --- ▲ [오류 수정] ---

export default MapProvider;