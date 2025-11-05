import { useContext } from 'react';
import { MapContext } from '../contexts/MapProvider';

/**
 * MapContext에서 kakaoMap 객체를 쉽게 꺼내쓸 수 있는 훅
 * @returns {{ kakaoMap: object | null }}
 */
export const useKakaoMap = () => {
    const context = useContext(MapContext);
    
    if (!context) {
        throw new Error('useKakaoMap must be used within a MapProvider. Make sure to wrap your component tree with <MapProvider>.');
    }
    
    // value prop에서 { kakaoMap } 객체를 반환
    return context; 
};