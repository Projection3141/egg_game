// App.js
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";

/** ****************************************************************************
 * Egg Tap Game (Expo / React Native)
 *
 * 요구사항 구현:
 *  - 화면 정중앙: "달걀 이미지"를 화면 기준 80% 크기로 배치 (정사각 컨테이너 안에 contain)
 *  - 달걀 위(상단 오버레이): 화면 80% 가로, 20% 세로 영역에 숫자 텍스트 표시
 *  - 카운트: 0 시작, 최대 99, 다음은 "clear"
 *  - 달걀 터치 인식: "눌림(hover 느낌)" 효과 + 카운트 증가
 *  - 텍스트가 clear이면 깨진 달걀 이미지로 변경
 *  - 이미지 경로: 로컬 require 임시 지정 (assets/egg.png, assets/egg_broken.png)
 ******************************************************************************/

/** ✅ 화면 기준 비율 상수 (원하면 여기만 조절) */
const UI = {
  EGG_SIZE_RATIO: 0.8, // 화면의 80% 크기(최소 축 기준)
  LABEL_WIDTH_RATIO: 0.8, // 화면 가로의 80%
  LABEL_HEIGHT_RATIO: 0.2, // 화면 세로의 20%
  MAX_COUNT: 99,
};

export default function App() {
  /** ✅ count: 0..99, 100부터는 clear 처리 */
  const [count, setCount] = useState(0);

  /** ✅ clear 상태 */
  const isClear = count > UI.MAX_COUNT;

  /** ✅ 라벨 텍스트 */
  const label = isClear ? "clear" : String(count);

  /** ✅ 화면 크기 */
  const { width, height } = Dimensions.get("window");

  /** ✅ 달걀 컨테이너 크기(정사각형): 화면의 짧은 축 기준 80% */
  const eggBoxSize = useMemo(() => {
    const minSide = Math.min(width, height);
    return Math.floor(minSide * UI.EGG_SIZE_RATIO);
  }, [width, height]);

  /** ✅ 라벨 영역 크기 */
  const labelWidth = Math.floor(width * UI.LABEL_WIDTH_RATIO);
  const labelHeight = Math.floor(height * UI.LABEL_HEIGHT_RATIO);

  /** ✅ 이미지 소스 */
  const eggImg = useMemo(() => {
    // clear되면 깨진 달걀로 교체
    return isClear
      ? require("./assets/egg_broken.png")
      : require("./assets/egg.png");
  }, [isClear]);

  /** ✅ 달걀 터치 핸들러 */
  const handlePress = () => {
    setCount((prev) => prev + 1);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* ================================================================
         * (A) 텍스트 라벨 영역: 화면 80% 가로, 20% 세로
         * - "달걀 위"에 얹히는 느낌을 위해 absolute overlay로 배치
         * - 중앙 정렬
         * ================================================================ */}
        <View
          style={[
            styles.labelOverlay,
            {
              width: labelWidth,
              height: labelHeight,
              top: Math.max(12, height * 0.06),
            },
          ]}
          pointerEvents="none" // 라벨이 터치 이벤트를 막지 않도록
        >
          <Text style={styles.labelText}>{label}</Text>
          {!isClear && (
            <Text style={styles.subText}>Tap the egg</Text>
          )}
        </View>

        {/* ================================================================
         * (B) 달걀 영역: 화면 중앙, 80% 크기
         * - Pressable로 터치 인식 + 눌림 효과(hover 느낌)
         * ================================================================ */}
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.eggBox,
            {
              width: eggBoxSize,
              height: eggBoxSize,
              transform: [
                { scale: pressed ? 0.98 : 1 }, // ✅ 눌림 효과
              ],
              opacity: pressed ? 0.92 : 1,
            },
            pressed && styles.eggPressedShadow,
          ]}
          android_ripple={{
            color: "rgba(0,0,0,0.08)",
            borderless: false,
          }}
        >
          <Image source={eggImg} style={styles.eggImage} />
        </Pressable>

        {/* ================================================================
         * (C) 간단 리셋 버튼 (디버그/테스트용)
         * - 필요 없으면 제거
         * ================================================================ */}
        <Pressable
          onPress={() => setCount(0)}
          style={({ pressed }) => [
            styles.resetBtn,
            pressed && { opacity: 0.75 },
          ]}
        >
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/** ✅ iOS 상단 상태바 영역 보정 */
const topPad = Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: topPad,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /** 라벨 오버레이 */
  labelOverlay: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  labelText: {
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#111827",
    textTransform: "uppercase",
  },
  subText: {
    marginTop: 6,
    fontSize: 14,
    color: "#6b7280",
  },

  /** 달걀 박스 */
  eggBox: {
    borderRadius: 26,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8, // Android shadow
  },
  eggPressedShadow: {
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  eggImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  /** 리셋 버튼 */
  resetBtn: {
    position: "absolute",
    bottom: 100,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#111827",
  },
  resetText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
