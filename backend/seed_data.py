# app/seed_data.py (새로운 콘텐츠/리뷰 데이터 적용 + 사용자/가이드 생성 복원)

from sqlalchemy.orm import Session
from sqlalchemy import func # 평균 계산 위해 추가
from datetime import datetime, timedelta
import bcrypt
import random
# Booking, GuideReview, GuideProfile 모델 임포트 추가
from models import User, GuideProfile, Content, ContentImage, Tag, ContentTag, Review, Booking, GuideReview, ContentVideo # ContentVideo 추가

# bcrypt 라이브러리 설치 필요: pip install bcrypt

# frontend/public 폴더 기준 이미지 경로 (스크린샷 기반)
IMAGE_MAP = {
    "SEO_Night": "/Seoul_night_view.png",
    "BUS_Cafe": "/busan_sea.png", # busan_sea.png 사용
    "JEJ_Trek": "/Jeju_trekking.png",
    "GYE_Hist": "/Gyeongju_Historical_Tour.png",
    "GWJ_Seorak": "/SeorakMountain_Climbing.png",
    "INC_China": "/Incheon_Chinatown.png",
    "DG_Cafe": "/Daegu_Cafe.png",
    "DJN_Sci": "/Daejeon_ScienceCity.png",
    "USN_Whale": "/Ulsan_WhaleVillage.png",
    "SEO_Bike": "/HanRiver_Bicycle.png",
    # 기타 이미지 (필요 시 추가 할당)
    "Default_Beach": "/beach.png",
    "Default_Food": "/food.png",
    "Default_Hanok": "/hanok.png",
    "Default_Hiking": "/hiking.png",
    "Default_Sunset": "/sunset.png",
    "Default_Traditional": "/traditional.png",
}

# --- ▼ 제공된 콘텐츠 및 리뷰 데이터 ▼ ---
SEED_CONTENTS_DATA = [
    {
        "location": "SEO", "guide_key": "SeoulInsider", "tag_key": "서울여행", "image_key": "SEO_Night", # guide_key 수정
        "title": "서울 야경 감성 투어 🌃",
        "description": "남산타워, 청계천, 광화문 등 서울의 대표 야경 명소를 걸으며 감성 가득한 밤 산책을 즐길 수 있습니다.",
        "tags": ["야경", "사진촬영"],
        "reviews": [
            (5, "서울의 밤이 이렇게 아름다운 줄 몰랐어요!"), (4, "가이드님 설명이 섬세해서 너무 좋았어요."),
            (5, "서울의 밤이 이렇게 예쁜 줄 처음 알았어요!"), (5, "남산에서 내려다본 불빛이 정말 감동적이었어요."),
            (5, "데이트 코스로 최고! 사진도 너무 잘 나와요."), (4, "가이드님 설명이 정말 섬세했어요."),
            (5, "청계천 산책로 너무 분위기 있어요."), (4, "야경 스팟마다 멈춰서 쉬는 게 좋았어요."),
            (3, "생각보다 코스가 짧아서 조금 아쉬웠어요."), (5, "도심 속 힐링 타임이었어요."),
            (5, "사진 찍기 좋은 포인트를 잘 알려주셨어요."), (4, "서울의 밤공기 너무 좋아요."),
            (5, "교통 접근성도 좋아서 부담 없이 다녀왔어요."), (5, "광화문 야경 진짜 장관이네요."),
            (4, "시간이 조금 더 길면 좋겠어요."), (5, "친구랑 갔는데 둘 다 만족했어요."),
            (4, "생각보다 덜 붐벼서 좋았어요."), (5, "야경 사진 덕분에 SNS 좋아요 폭발!"),
            (4, "가성비 좋은 투어였어요."), (5, "서울 여행 중 꼭 해야 할 코스!"),
            (4, "살짝 추웠지만 분위기가 다 했어요."), (5, "조용히 야경 보며 힐링할 수 있었어요.")
        ]
    },
    {
        "location": "BUS", "guide_key": "BusanOceanExpert", "tag_key": "부산여행", "image_key": "BUS_Cafe", # guide_key 수정
        "title": "부산 바다 감성 카페 투어 ☕🌊",
        "description": "해운대와 송정에 위치한 오션뷰 카페를 하루 만에 즐길 수 있는 투어입니다.",
        "tags": ["해변", "맛집"],
        "reviews": [
            (5, "바다 앞 카페에서 마신 커피는 인생 커피였어요."), (5, "뷰가 너무 예뻐서 하루 종일 있고 싶었어요."),
            (5, "사진이 실제보다 덜 나올 정도로 예뻐요."), (5, "송정 쪽 카페 추천 정말 감사해요!"),
            (4, "가이드님이 포토존 잘 알려주셨어요."), (3, "사람이 많아서 조금 시끄러웠어요."),
            (5, "분위기 최고, 커피도 맛있어요."), (5, "날씨 좋은 날 가면 진짜 힐링이에요."),
            (4, "부산 여행 코스로 딱이에요."), (5, "사진 찍기 너무 좋아요."),
            (5, "바다와 커피라니... 완벽 조합!"), (4, "친구랑 둘이 너무 즐거웠어요."),
            (5, "조용한 카페도 많아서 좋았어요."), (4, "시간이 좀 더 길면 좋겠어요."),
            (5, "해질 무렵 뷰가 정말 예술이에요."), (5, "기대 이상으로 만족스러웠어요."),
            (5, "커피 맛도 수준급이에요."), (4, "조금 더 다양한 카페 코스가 있으면 좋겠어요."),
            (5, "다음엔 가족이랑 다시 올래요."), (5, "햇살과 파도소리가 잊히지 않아요.")
        ]
    },
    {
        "location": "JEJ", "guide_key": "JejuWind", "tag_key": "제주여행", "image_key": "JEJ_Trek", # guide_key 수정
        "title": "제주 동쪽 일출 트래킹 🌅",
        "description": "성산일출봉에서 시작하는 제주 동부 일출 등반 코스! 맑은 공기와 함께 활력을 얻어가세요.",
        "tags": ["등산", "사진촬영"],
        "reviews": [
            (5, "일출 보면서 울컥했어요."), (5, "성산일출봉은 언제 봐도 감동이에요."),
            (4, "새벽 출발이라 힘들지만 보람 있었어요."), (5, "가이드님이 안전하게 안내해주셔서 좋았어요."),
            (5, "하늘이 붉게 물드는 장면이 아직도 생생해요."), (3, "날씨가 흐려서 일출은 못 봤지만 좋았어요."),
            (5, "공기가 너무 맑아요."), (5, "다음엔 부모님도 데리고 오고 싶어요."),
            (5, "풍경이 영화 같아요."), (4, "체력은 좀 필요하지만 가치 있어요."),
            (4, "혼자 와도 충분히 즐길 수 있어요."), (5, "사진 찍기 좋은 포인트 알려주셔서 감사해요."),
            (5, "제주 자연의 위대함을 느꼈어요."), (4, "새벽 공기가 상쾌했어요."),
            (4, "다음에는 더 따뜻할 때 가고 싶어요."), (5, "가이드님이 사진도 잘 찍어주셨어요."),
            (5, "구성도 좋고 진행도 매끄러웠어요."), (4, "잠 덜 자서 힘들었지만 만족!"),
            (5, "정말 추천합니다!"), (5, "제주 여행 중 베스트 코스였어요.")
        ]
    },
    {
        "location": "GYE", "guide_key": "SeoulInsider", "tag_key": "경주여행", "image_key": "GYE_Hist", # 가이드 임의 지정
        "title": "경주 역사 유적 답사 투어 🏛",
        "description": "불국사와 대릉원 등 천년 고도 경주의 매력을 현지 가이드와 함께 체험합니다.",
        "tags": ["역사", "사진촬영"],
        "reviews": [
            (5, "역사에 관심 없는 저도 재밌게 들었어요."), (4, "가이드님의 설명이 너무 친절했어요."),
            (5, "역사 공부하면서 여행하는 기분이었어요."), (5, "불국사 너무 아름다웠어요."),
            (4, "가이드님 설명이 귀에 쏙쏙 들어왔어요."), (5, "아이들이랑 가기 딱 좋아요."),
            (5, "대릉원 풍경이 정말 평화로웠어요."), (5, "역사 좋아하는 사람은 꼭 가야 해요."),
            (4, "조금 더 오래 머물고 싶었어요."), (5, "사진 찍기 좋은 포인트도 많아요."),
            (4, "조용해서 마음이 편안했어요."), (5, "시간 배분이 잘 되어 있었어요."),
            (5, "신라시대 이야기 흥미로웠어요."), (5, "다음엔 단풍철에 다시 가고 싶어요."),
            (5, "코스 구성이 완벽했어요."), (5, "부모님이 너무 좋아하셨어요."),
            (4, "비 오는데도 운치 있었어요."), (5, "사진보다 실물이 훨씬 멋져요."),
            (5, "설명이 지루하지 않고 재밌었어요."), (4, "아이들도 흥미로워했어요."),
            (5, "역사와 여행을 동시에 느낄 수 있었어요."), (5, "가이드님 최고!")
        ]
    },
    {
        "location": "GWJ", "guide_key": "BusanOceanExpert", "tag_key": "강원여행", "image_key": "GWJ_Seorak", # 가이드 임의 지정
        "title": "강원도 설악산 힐링 등산 🌲",
        "description": "초보자도 참여 가능한 설악산 트래킹 코스! 자연 속에서 휴식과 힐링을 느껴보세요.",
        "tags": ["등산", "힐링"],
        "reviews": [
            (5, "공기가 너무 맑아요! 피톤치드 제대로."), (4, "코스가 적당해서 부담 없이 즐겼어요."),
            (4, "힘들었지만 뿌듯했어요."), (5, "정상에서 본 풍경이 장관이에요."),
            (5, "가이드님이 페이스 잘 맞춰주셨어요."), (4, "초보자도 충분히 완주 가능!"),
            (5, "산새 소리 들으면서 힐링했어요."), (5, "날씨도 좋고 분위기도 최고예요."),
            (5, "운동 겸 여행으로 완벽했어요."), (4, "휴식 시간도 잘 배분돼 있었어요."),
            (4, "자연이 주는 평온함을 느꼈어요."), (5, "사진 찍을 포인트가 많아요."),
            (5, "가을 단풍 시즌엔 더 예쁠 것 같아요."), (5, "등산로 정비가 잘 되어 있어요."),
            (4, "체력 약한 저도 완주했어요!"), (5, "바람 소리와 새소리 들리던 게 기억나요."),
            (5, "스트레스가 확 풀렸어요."), (5, "물 한 모금이 그렇게 맛있을 줄이야."),
            (5, "친구랑 같이 가서 좋은 추억 남겼어요."), (4, "가성비 좋은 힐링 코스예요."),
            (5, "자연 속에서 충전한 느낌이에요.")
        ]
    },
    {
        "location": "INC", "guide_key": "JejuWind", "tag_key": "인천여행", "image_key": "INC_China", # 가이드 임의 지정
        "title": "인천 차이나타운 미식 탐방 🍜",
        "description": "인천 차이나타운 명물 ‘짜장면 거리’에서 현지 중국 음식 문화를 직접 체험할 수 있는 투어입니다.",
        "tags": ["맛집", "문화체험"],
        "reviews": [
            (5, "짜장면, 탕수육, 만두까지 완벽 코스!"), (4, "맛뿐 아니라 거리 풍경도 예뻤어요."),
            (5, "짜장면 맛이 정말 남달라요."), (5, "현지 느낌 그대로예요."),
            (5, "가이드님 덕분에 알찬 투어였어요."), (5, "탕수육이 바삭바삭!"),
            (4, "골목마다 향신료 향이 진해서 신기했어요."), (5, "식도락 여행으로 딱이에요."),
            (5, "거리 분위기도 이국적이에요."), (4, "사진 포인트도 많았어요."),
            (5, "디저트 가게도 다양해요."), (5, "가성비 최고입니다."),
            (5, "아이들이 너무 좋아했어요."), (4, "식당들마다 개성이 뚜렷해요."),
            (5, "시간이 금방 갔어요."), (5, "리뷰 보고 갔는데 진짜 맛집이에요."),
            (5, "짬뽕 국물 깊은 맛 최고."), (4, "혼자라도 충분히 즐길 수 있어요."),
            (5, "먹는 내내 행복했어요."), (5, "골목 분위기 덕분에 여행 느낌 물씬."),
            (5, "음식 퀄리티가 기대 이상."), (5, "다시 가고 싶어요.")
        ]
    },
    {
        "location": "DG", "guide_key": "SeoulInsider", "tag_key": "대구여행", "image_key": "DG_Cafe", # 가이드 임의 지정
        "title": "대구 근교 감성 카페 투어 ☕🌾",
        "description": "대구 근교에 위치한 감성 인스타 핫플 카페들을 하루 만에 둘러볼 수 있습니다.",
        "tags": ["카페", "사진촬영"],
        "reviews": [
            (5, "카페마다 분위기가 달라서 너무 재밌었어요."), (4, "가성비 좋은 코스였어요."),
            (5, "사진 맛집이 이렇게 많다니!"), (5, "감성 카페 투어라 이름 그대로예요."),
            (5, "커피 향이 아직도 기억나요."), (4, "하루 일정이 알찼어요."),
            (5, "디저트 퀄리티가 좋았어요."), (5, "날씨 덕분에 사진도 예쁘게 나왔어요."),
            (5, "대구 근교 이렇게 예쁜 곳이 많을 줄이야."), (5, "분위기 좋은 카페만 골라주셔서 감사해요."),
            (4, "조용하고 힐링됐어요."), (5, "인스타용 사진 100장 찍었어요."),
            (5, "다음엔 친구랑 다시 오고 싶어요."), (5, "카페 분위기 하나하나 다 달랐어요."),
            (4, "음악이 좋아서 여운이 남았어요."), (5, "사람도 많지 않아 여유로웠어요."),
            (5, "일상에서 벗어난 느낌이었어요."), (5, "커피 맛이 진짜 좋아요."),
            (5, "하루 종일 힐링했어요."), (5, "감성 사진 덕분에 SNS 터졌어요."),
            (4, "조용히 혼자 가기에도 좋아요."), (5, "가이드님 추천 진짜 믿을만했어요.")
        ]
    },
    {
        "location": "DJN", "guide_key": "BusanOceanExpert", "tag_key": "대전여행", "image_key": "DJN_Sci", # 가이드 임의 지정
        "title": "대전 과학도시 투어 🔬",
        "description": "국립중앙과학관과 엑스포과학공원 등 과학의 도시 대전을 체험할 수 있는 코스입니다.",
        "tags": ["교육", "가족여행"],
        "reviews": [
            (5, "아이들과 함께 하기 딱 좋았어요."), (4, "교육적이고 재밌는 투어였어요."),
            (5, "아이들과 함께라 정말 유익했어요."), (5, "과학관 체험코너가 너무 재밌었어요."),
            (5, "아이들이 눈을 반짝이더라구요."), (4, "가이드님이 설명을 쉽게 해주셨어요."),
            (5, "교육적이면서도 지루하지 않았어요."), (5, "과학 좋아하는 아이에게 최고 선물!"),
            (4, "날씨도 좋고 분위기도 좋아서 만족했어요."), (5, "엑스포공원 진짜 크네요!"),
            (5, "체험형이라 아이들이 몰입했어요."), (5, "기초과학관 너무 재밌어요."),
            (4, "과학에 흥미를 느끼게 되었어요."), (5, "아이들과 가족 단위로 강력 추천!"),
            (5, "시간 가는 줄 몰랐어요."), (5, "가성비 좋은 가족 여행이에요."),
            (4, "직원분들도 친절하셨어요."), (5, "다양한 전시물이 있어서 좋았어요."),
            (5, "어른도 흥미로웠어요."), (4, "아이들 과학 숙제에 도움됐어요."),
            (5, "이런 체험형 투어 너무 좋아요."), (5, "재방문 의사 100%입니다.")
        ]
    },
    {
        "location": "USN", "guide_key": "JejuWind", "tag_key": "울산여행", "image_key": "USN_Whale", # 가이드 임의 지정
        "title": "울산 고래문화 마을 투어 🐋",
        "description": "고래문화마을과 장생포항을 중심으로 울산의 해양문화를 알아보는 프로그램입니다.",
        "tags": ["문화체험", "가족여행"],
        "reviews": [
            (5, "고래 박물관이 정말 흥미로웠어요."), (5, "고래박물관 진짜 재밌어요!"),
            (5, "아이들이 너무 좋아했어요."), (4, "해양문화 배울 수 있어서 좋아요."),
            (5, "사진 찍기 좋은 스팟 많아요."), (5, "고래 모형이 실제 같아요."),
            (5, "가이드님 설명이 자세했어요."), (5, "아이들과 함께 하기 최고예요."),
            (4, "기념품샵도 귀여운 게 많아요."), (5, "날씨 좋으면 산책하기도 좋아요."),
            (5, "고래 영상관은 꼭 봐야 해요."), (4, "조용하고 평화로운 분위기예요."),
            (5, "전시물 구성이 알차요."), (5, "아이 교육용으로도 좋습니다."),
            (4, "고래와 바다 생태에 대해 배웠어요."), (5, "주차장도 넓고 접근성 좋아요."),
            (5, "가족끼리 오면 완전 만족!"), (5, "사진도 예쁘게 잘 나와요."),
            (5, "아이들이 고래 인형을 너무 좋아했어요."), (5, "감동적인 체험이었어요."),
            (5, "울산 오면 꼭 들러야 해요.")
        ]
    },
     {
        "location": "SEO", "guide_key": "SeoulInsider", "tag_key": "서울여행", "image_key": "SEO_Bike", # guide_key 수정
        "title": "서울 한강 자전거 투어 🚴‍♂️",
        "description": "여의도에서 잠실까지 이어지는 한강 자전거길을 따라 시원하게 달리는 투어입니다.",
        "tags": ["액티비티", "야경"],
        "reviews": [
            (5, "강바람 맞으면서 달리니 너무 시원했어요."), (4, "자전거 상태도 좋고 안전했어요."),
            (5, "가볍게 운동도 되고 여행도 돼요."), (5, "여의도~잠실 코스 최고예요."),
            (4, "처음 타는 사람도 괜찮아요."), (5, "야경 보면서 타니까 낭만적이었어요."),
            (5, "가이드님이 속도 조절 잘 해주셨어요."), (5, "날씨만 좋으면 완벽한 코스예요."),
            (5, "바람이 상쾌해서 힐링했어요."), (4, "휴식 시간도 적당했어요."),
            (4, "자전거 초보도 무리 없어요."), (5, "서울에서 이런 여유가 가능하다니!"),
            (5, "안전장비도 잘 챙겨주셔서 안심됐어요."), (5, "사진 포인트마다 멈춰주셔서 좋았어요."),
            (4, "생각보다 체력 소모가 적었어요."), (5, "커플 코스로도 최고예요."),
            (5, "일몰 시간대 추천합니다."), (5, "경치가 너무 예뻐서 계속 감탄했어요."),
            (5, "자전거 타며 서울 구경 제대로 했어요."), (5, "다시 타고 싶은 투어예요.")
        ]
    },
]
# --- ▲ 제공된 콘텐츠 및 리뷰 데이터 종료 ▲ ---


def create_seed_data(db: Session):
    """
    제공된 실제 콘텐츠 및 리뷰 데이터로 데이터베이스를 초기화합니다.
    """
    print("--- Travia Project Database Initializer ---")
    
    # --- 0. 기존 데이터 삭제 ---
    print("1. Attempting to delete existing data...")
    try:
        # 관계 설정 고려하여 삭제 순서 중요 (자식 -> 부모)
        db.query(ContentTag).delete()
        db.query(GuideReview).delete() # 가이드 리뷰 먼저
        db.query(Review).delete()      # 상품 리뷰 다음
        db.query(Booking).delete()     # 예약 다음
        db.query(ContentImage).delete()
        db.query(ContentVideo).delete() # 비디오 테이블 추가 (있다면)
        db.query(Content).delete()     # 콘텐츠 다음
        db.query(Tag).delete()
        db.query(GuideProfile).delete()
        db.query(User).delete()
        db.commit()
        print("   ✅ Existing data deleted successfully.")
    except Exception as e:
        print(f"   ❌ Error deleting data: {e}")
        db.rollback()
        return # 데이터 삭제 실패 시 중단

    # --- 1. User & Guide Profiles ---
    print("2. Creating Users and Guide Profiles...")
    users = {} # 생성된 유저 객체 저장용 (닉네임 -> User 객체)
    try:
        raw_password = "testpass123"
        hashed_password = bcrypt.hashpw(raw_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        traveler_data = [
            ("traveler@travia.com", "ExploringKim"),
            ("traveler2@travia.com", "VoyageJoy"),
            ("traveler3@travia.com", "MinSu"),
        ]
        guide_data = [
            ("guide1_seoul@travia.com", "SeoulInsider", "5년 경력의 서울 전문 가이드.", "SEO"),
            ("guide2_busan@travia.com", "BusanOceanExpert", "해운대부터 감천문화마을까지 안내합니다.", "BUS"),
            ("guide3_jeju@travia.com", "JejuWind", "한라산과 오름, 제주의 자연을 사랑하는 가이드입니다.", "JEJ"),
        ]

        for email, nickname in traveler_data:
            user = User(email=email, nickname=nickname, password=hashed_password, user_type="traveler")
            db.add(user)
            users[nickname] = user # 닉네임으로 User 객체 저장
        db.flush() # ID 할당

        for email, nickname, bio, loc in guide_data:
            user = User(email=email, nickname=nickname, password=hashed_password, user_type="guide")
            db.add(user)
            db.flush() # user.id 얻기
            users[nickname] = user # 닉네임으로 User 객체 저장
            guide_profile = GuideProfile(
                users_id=user.id,
                bio=bio,
                license_status= "Licensed" if loc != "JEJ" else "Pending", # 제주 가이드만 Pending
                avg_rating=0.0, # 초기 평점 0.0 (나중에 계산)
                manner_score=100
            )
            db.add(guide_profile)

        db.commit() # 유저, 가이드 프로필 생성 완료
        print(f"   ✅ {len(users)} users ({len(traveler_data)} travelers, {len(guide_data)} guides) created.")
    except Exception as e:
        print(f"   ❌ Error creating users/guides: {e}")
        db.rollback()
        return

    # --- 2. Tags ---
    print("3. Creating Tags...")
    # SEED_CONTENTS_DATA 에서 필요한 모든 태그 추출 + 기본 태그
    tags_needed = set()
    for item in SEED_CONTENTS_DATA:
        tags_needed.add(item["tag_key"]) # 지역 태그
        tags_needed.update(item.get("tags", [])) # 활동 태그
    tags_needed.update([ # 기본 태그 추가 (혹시 빠진 경우 대비)
        "야경", "역사", "사진촬영", "해변", "등산", "맛집", "힐링", "문화체험", "카페", "교육", "가족여행", "액티비티",
        "서울여행", "부산여행", "제주여행"
    ])

    existing_tags_db = {tag.name for tag in db.query(Tag.name).all()}
    tags = {} # 태그 이름 -> Tag 객체 맵
    try:
        new_tag_objs = []
        for tag_name in tags_needed:
            if tag_name not in existing_tags_db:
                tag_type = "Location" if "여행" in tag_name else "Activity" # 간단 분류
                new_tag_objs.append(Tag(name=tag_name, tag_type=tag_type))

        if new_tag_objs:
            db.add_all(new_tag_objs)
            db.commit() # 새 태그 저장
            print(f"   ✅ {len(new_tag_objs)} new tags created: {[t.name for t in new_tag_objs]}")
        else:
             print("   ✅ All required tags already exist or no new tags needed.")

        # 모든 태그 객체를 딕셔너리에 저장
        all_db_tags = db.query(Tag).all()
        for tag in all_db_tags:
            tags[tag.name] = tag
        print(f"   ✅ Total {len(tags)} tags loaded into memory.")

    except Exception as e:
        print(f"   ❌ Error creating/loading tags: {e}")
        db.rollback()
        return

    # --- 3. Content, Images, Bookings, Reviews, ContentTags ---
    print("4. Creating Contents, Images, Bookings, Reviews, and Tags...")
    total_contents = 0
    total_bookings = 0
    total_reviews = 0
    total_guide_reviews = 0
    # [수정] 가이드 ID를 키로 사용하여 평점 저장
    guide_ratings = {user_obj.id: [] for user_obj in users.values() if user_obj.user_type == 'guide'} 

    try:
        traveler_users_list = [u for u in users.values() if u.user_type == 'traveler'] # 여행자 리스트 미리 생성
        if not traveler_users_list:
             print("   ⚠️ No traveler users found to create reviews. Aborting content creation.")
             return

        for content_data in SEED_CONTENTS_DATA:
            guide_user = users.get(content_data["guide_key"]) # 닉네임으로 가이드 User 객체 찾기
            if not guide_user:
                print(f"   ⚠️ Warning: Guide user '{content_data['guide_key']}' not found. Skipping content '{content_data['title']}'.")
                continue

            # 3-1. Content 생성
            new_content = Content(
                guide_id=guide_user.id,
                title=content_data["title"],
                description=content_data["description"],
                price=random.randint(3, 10) * 10000,
                location=content_data["location"],
                status="Active",
                created_at=datetime.now() - timedelta(days=random.randint(1, 30))
            )
            db.add(new_content)
            db.flush() # content.id 얻기
            total_contents += 1

            # 3-2. ContentImage 생성
            image_path = IMAGE_MAP.get(content_data["image_key"], IMAGE_MAP["Default_Beach"])
            db.add(ContentImage(contents_id=new_content.id, image_url=image_path, sort_order=1, is_main=True))

            # 3-3. ContentTag 생성
            location_tag_obj = tags.get(content_data["tag_key"])
            if location_tag_obj:
                db.add(ContentTag(contents_id=new_content.id, tag_id=location_tag_obj.id, is_ai_extracted=False))
            else:
                 print(f"   ⚠️ Warning: Location tag '{content_data['tag_key']}' not found for content '{new_content.title}'.")

            for tag_name in content_data.get("tags", []):
                act_tag_obj = tags.get(tag_name)
                if act_tag_obj:
                    # 지역 태그와 중복 방지 (선택적)
                    if not location_tag_obj or act_tag_obj.id != location_tag_obj.id:
                        db.add(ContentTag(contents_id=new_content.id, tag_id=act_tag_obj.id, is_ai_extracted=False))
                else:
                    print(f"   ⚠️ Warning: Activity tag '{tag_name}' not found for content '{new_content.title}'.")


            # 3-4. Booking, Review, GuideReview 생성
            reviews_for_this_content = content_data.get("reviews", [])
            # 생성할 리뷰 수가 여행자 수보다 많으면 중복 선택될 수 있음
            reviewers_for_this_content = random.choices(traveler_users_list, k=len(reviews_for_this_content)) 

            for i, (review_rating, review_text) in enumerate(reviews_for_this_content):
                reviewer = reviewers_for_this_content[i]

                # (1) 가짜 'Completed' Booking 생성
                new_booking = Booking(
                    traveler_id=reviewer.id,
                    content_id=new_content.id,
                    booking_date=datetime.now() - timedelta(days=random.randint(1, 10)),
                    personnel=random.randint(1, 4),
                    status="Completed"
                )
                db.add(new_booking)
                db.flush() # booking.id 얻기
                total_bookings += 1

                # (2) 상품 리뷰 (Review) 생성
                db.add(Review(
                    booking_id=new_booking.id,
                    reviewer_id=reviewer.id,
                    rating=review_rating,
                    text=review_text,
                    created_at=datetime.now() - timedelta(hours=random.randint(1, 24)) # 시간 단위로 변경
                ))
                total_reviews += 1

                # (3) 가이드 리뷰 (GuideReview) 생성
                guide_review_rating = review_rating # 상품 평점과 동일하게 사용 (또는 랜덤)
                # guide_review_rating = random.randint(3, 5) # 또는 랜덤 평점
                db.add(GuideReview(
                    booking_id=new_booking.id,
                    guide_id=guide_user.id,
                    reviewer_id=reviewer.id,
                    rating=guide_review_rating,
                    text=f"가이드님 덕분에 즐거운 시간이었습니다. ({random.choice(['친절해요', '설명이 좋아요', '시간을 잘 지켜요', '유머러스해요'])})", # 임의 텍스트
                    created_at=datetime.now() - timedelta(hours=random.randint(1, 24))
                ))
                total_guide_reviews += 1
                # [수정] 가이드 ID를 키로 사용하여 평점 추가
                guide_ratings[guide_user.id].append(guide_review_rating)

        db.commit() # 모든 변경사항 저장
        print(f"   ✅ {total_contents} contents, {total_bookings} bookings, {total_reviews} reviews, {total_guide_reviews} guide reviews created.")

        # --- 4. 가이드 평균 평점 업데이트 ---
        print("5. Updating Guide Average Ratings...")
        updated_guides = 0
        for guide_id, ratings in guide_ratings.items():
            if ratings: # 해당 가이드에 대한 리뷰가 1개 이상 있을 때
                guide_profile_obj = db.query(GuideProfile).filter_by(users_id=guide_id).first()
                if guide_profile_obj:
                    # SQLAlchemy func.avg 사용 대신 Python으로 직접 계산
                    new_avg = round(sum(ratings) / len(ratings), 1)
                    guide_profile_obj.avg_rating = new_avg
                    updated_guides += 1
                    # [수정] 가이드 닉네임 표시 (users 딕셔너리 활용)
                    guide_nickname_for_log = next((nk for nk, u in users.items() if u.id == guide_id), f"ID:{guide_id}")
                    print(f"   - Guide '{guide_nickname_for_log}' avg_rating updated to {new_avg}")

        if updated_guides > 0:
            db.commit() # 평균 평점 변경사항 저장
            print(f"   ✅ {updated_guides} guide profiles updated.")
        else:
             print("   ✅ No guide ratings to update.")

    except Exception as e:
        import traceback # 상세 에러 출력을 위해 추가
        print(f"   ❌ Error during content/review creation or rating update: {e}")
        traceback.print_exc() # 상세 트레이스백 출력
        db.rollback()
    finally:
        db.close()

# 스크립트 직접 실행 시 함수 호출
if __name__ == "__main__":
    from database import SessionLocal
    db = SessionLocal()
    try:
        create_seed_data(db)
    finally:
        db.close()

