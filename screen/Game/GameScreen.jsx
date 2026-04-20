// screen/Game/GameScreen.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** ****************************************************************************
 * 단계
 * 1: 시작 화면
 * 2: 4~7 선택
 * 3: 박스 선택
 * 4: 채굴 숫자 선택
 * 5: 결과 화면
 ******************************************************************************/
const STEP = {
  INTRO: 1,
  FIND: 2,
  THINK: 3,
  MINING: 4,
  RESULT: 5,
};

const UI = {
  DRAWER_WIDTH_RATIO: 0.4,
  OVERLAY_OPACITY: 0.7,
  HERO_SIZE_RATIO: 0.9,
  HERO_TOP_RATIO: 0.3,
  OPTION_TOP_RATIO: 0.13,
};

const START_OPTIONS = [4, 5, 6, 7];
const NUMBER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function GameScreen({ onGoWebView }) {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get("window");

  /** **************************************************************************
   * 공통 레이아웃 값
   ************************************************************************** */
  const heroSize = useMemo(() => {
    const minSide = Math.min(width, height);
    return Math.floor(minSide * UI.HERO_SIZE_RATIO);
  }, [width, height]);

  const drawerWidth = Math.floor(width * UI.DRAWER_WIDTH_RATIO);

  /** **************************************************************************
   * 게임 상태
   ************************************************************************** */
  const [step, setStep] = useState(STEP.INTRO);
  const [selectedStartNumber, setSelectedStartNumber] = useState(null);
  const [count, setCount] = useState(0);

  /**
   * boxes
   * - value: 정답 숫자
   * - revealed: 성공하여 공개되었는지
   */
  const [boxes, setBoxes] = useState([]);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);

  /** 결과 상태 */
  const [resultType, setResultType] = useState(null); // "win" | "lose"
  const [message, setMessage] = useState("");
  const [miningAnimating, setMiningAnimating] = useState(false);
  const [miningFrame, setMiningFrame] = useState(1);
  const [failedNumbers, setFailedNumbers] = useState([]);

  /** 채굴 애니메이션 타이머 ref */
  const miningIntervalRef = useRef(null);
  const miningTimeoutRef = useRef(null);

  /** **************************************************************************
   * Drawer 상태
   ************************************************************************** */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(drawerAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setDrawerOpen(false);
    });
  };

  const drawerTranslateX = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth, 0],
  });

  const overlayOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, UI.OVERLAY_OPACITY],
  });

  /** **************************************************************************
   * 박스 생성
   ************************************************************************** */
  const createBoxes = (boxCount) => {
    return Array.from({ length: boxCount }, (_, index) => ({
      id: `box-${index}`,
      value: Math.floor(Math.random() * 9) + 1,
      revealed: false,
    }));
  };

  /** **************************************************************************
   * 전체 초기화
   ************************************************************************** */
  const resetAll = () => {
    setStep(STEP.INTRO);
    setSelectedStartNumber(null);
    setCount(0);
    setBoxes([]);
    setSelectedBoxIndex(null);
    setFailedNumbers([]);
    setResultType(null);
    setMessage("");
    setMiningAnimating(false);
    setMiningFrame(1);
  };

  /** **************************************************************************
   * 1 -> 2
   ************************************************************************** */
  const handleStartGame = () => {
    setMessage("");
    setResultType(null);
    setStep(STEP.FIND);
  };

  /** **************************************************************************
   * 2 -> 3
   * 선택 숫자 * 10 count 생성
   ************************************************************************** */
  const handleChooseStartNumber = (value) => {
    setSelectedStartNumber(value);
    setCount(35); // 기대값 : 4-> 24, 5 -> 30, 6 -> 36, 7 -> 42
    setBoxes(createBoxes(value));
    setSelectedBoxIndex(null);
    setResultType(null);
    setMessage("");
    setStep(STEP.THINK);
  };

  /** **************************************************************************
   * 3 -> 4
   * 공개되지 않은 박스만 선택 가능
   ************************************************************************** */
  const handleChooseBox = (index) => {
    if (boxes[index]?.revealed) return;

    setSelectedBoxIndex(index);
    setFailedNumbers([]);
    setMessage("");
    setStep(STEP.MINING);
  };

  /** **************************************************************************
   * 4단계 채굴 처리
   * - 2초 동안 0.5초마다 mining1/mining2 토글
   * - 성공: 해당 박스 공개 후 3단계 또는 전체 성공 시 5단계(win)
   * - 실패: count 감소 후 실패 문구 출력, count가 0이면 5단계(lose)
   *         아니면 4단계 유지해서 다시 시도
   ************************************************************************** */
  const handlePickMiningNumber = (pickedNumber) => {
    if (miningAnimating || selectedBoxIndex === null) return;

    setMiningAnimating(true);
    setMessage("");

    miningIntervalRef.current = setInterval(() => {
      setMiningFrame((prev) => (prev === 1 ? 2 : 1));
    }, 500);

    miningTimeoutRef.current = setTimeout(() => {
      clearInterval(miningIntervalRef.current);
      miningIntervalRef.current = null;

      setMiningAnimating(false);
      setMiningFrame(1);

      const targetBox = boxes[selectedBoxIndex];
      const isSuccess = pickedNumber === targetBox.value;

      /** 성공 처리 */
      if (isSuccess) {
        const nextBoxes = boxes.map((box, index) =>
          index === selectedBoxIndex
            ? { ...box, revealed: true, failed: false }
            : box
        );

        setBoxes(nextBoxes);
        setMessage("성공");

        const isAllRevealed = nextBoxes.every((box) => box.revealed);

        if (isAllRevealed) {
          setResultType("win");
          setStep(STEP.RESULT);
          return;
        }

        setFailedNumbers([]);
        setSelectedBoxIndex(null);
        setStep(STEP.THINK);
        return;
      }

      setFailedNumbers((prev) =>
        prev.includes(pickedNumber) ? prev : [...prev, pickedNumber]
      );

      const nextCount = Math.max(count - 1, 0);
      setCount(nextCount);
      setMessage("실패");

      if (nextCount === 0) {
        setResultType("lose");
        setStep(STEP.RESULT);
        return;
      }

      /** 아직 패배 아님: 같은 박스 대상으로 계속 4단계 유지 */
      setStep(STEP.MINING);
    }, 2000);
  };

  /** **************************************************************************
   * 언마운트 시 타이머 정리
   ************************************************************************** */
  useEffect(() => {
    return () => {
      if (miningIntervalRef.current) {
        clearInterval(miningIntervalRef.current);
      }
      if (miningTimeoutRef.current) {
        clearTimeout(miningTimeoutRef.current);
      }
    };
  }, []);

  /** **************************************************************************
   * 현재 히어로 이미지
   ************************************************************************** */
  const heroSource = useMemo(() => {
    if (step === STEP.INTRO) {
      return require("../../assets/hero_walking.png");
    }

    if (step === STEP.FIND) {
      return require("../../assets/hero_find.png");
    }

    if (step === STEP.THINK) {
      return require("../../assets/hero_thinking.png");
    }

    if (step === STEP.MINING) {
      return miningFrame === 1
        ? require("../../assets/hero_mining1.png")
        : require("../../assets/hero_mining2.png");
    }

    if (step === STEP.RESULT) {
      return resultType === "win"
        ? require("../../assets/hero_win.png")
        : require("../../assets/hero_lose.png");
    }

    return require("../../assets/hero_walking.png");
  }, [step, miningFrame, resultType]);

  /** **************************************************************************
   * 상단 영역 렌더
   ************************************************************************** */
  const renderTopArea = () => {
    /** 1단계: 제목 출력 */
    if (step === STEP.INTRO) {
      return (
        <View style={styles.topTitle}>
          <Text style={styles.topTitleText}>Coin Hero</Text>
        </View>
      );
    }

    /** 2단계: 4~7 선택 */
    if (step === STEP.FIND) {
      return (
        <View style={styles.topRow}>
          {START_OPTIONS.map((value) => (
            <Pressable
              key={value}
              onPress={() => handleChooseStartNumber(value)}
              style={({ pressed }) => [
                styles.optionButton,
                pressed && styles.optionButtonPressed,
              ]}
            >
              <Text style={styles.optionButtonText}>{value}</Text>
            </Pressable>
          ))}
        </View>
      );
    }

    /** 3/4단계: 박스 표시 */
    if (step === STEP.THINK || step === STEP.MINING) {
      return (
        <View style={styles.boxRow}>
          {boxes.map((box, index) => {
            const isSelected = index === selectedBoxIndex;
            const isRevealed = box.revealed;
            const disabled = step !== STEP.THINK || isRevealed;

            return (
              <Pressable
                key={box.id}
                disabled={disabled}
                onPress={() => handleChooseBox(index)}
                style={({ pressed }) => [
                  styles.numberBox,
                  isSelected && styles.numberBoxSelected,
                  isRevealed && styles.numberBoxRevealed,
                  pressed && !disabled && styles.numberBoxPressed,
                ]}
              >
                <Text style={styles.numberBoxText}>
                  {isRevealed ? box.value : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    return null;
  };

  /** **************************************************************************
   * 하단 영역 렌더
   ************************************************************************** */
  const renderBottomArea = () => {
    /** 1단계 */
    if (step === STEP.INTRO) {
      return (
        <Pressable
          onPress={handleStartGame}
          style={({ pressed }) => [
            styles.bottomMainButton,
            { bottom: insets.bottom + height * 0.2 - 80 },
            pressed && styles.bottomMainButtonPressed,
          ]}
        >
          <Text style={styles.bottomMainButtonText}>게임 시작</Text>
        </Pressable>
      );
    }

    /** 4단계 */
    if (step === STEP.MINING) {
      return (
        <View
          style={[
            styles.miningNumberRow,
            { bottom: insets.bottom + height * 0.2 - 80 },
          ]}
        >
          {NUMBER_OPTIONS.map((num) => {
            const isFailedNumber = failedNumbers.includes(num);

            return (
              <Pressable
                key={num}
                disabled={miningAnimating}
                onPress={() => handlePickMiningNumber(num)}
                style={({ pressed }) => [
                  styles.miningNumberButton,
                  isFailedNumber && styles.miningNumberButtonFailed,
                  miningAnimating && styles.miningNumberButtonDisabled,
                  pressed &&
                  !miningAnimating &&
                  styles.miningNumberButtonPressed,
                ]}
              >
                <Text style={styles.miningNumberButtonText}>
                  {isFailedNumber ? "X" : num}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    /** 5단계 */
    if (step === STEP.RESULT) {
      return (
        <Pressable
          onPress={resetAll}
          style={({ pressed }) => [
            styles.bottomMainButton,
            { bottom: insets.bottom + height * 0.2 - 80 },
            pressed && styles.bottomMainButtonPressed,
          ]}
        >
          <Text style={styles.bottomMainButtonText}>다시 시작</Text>
        </Pressable>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* 햄버거 */}
      {!drawerOpen && (
        <Pressable
          onPress={openDrawer}
          style={[styles.hamburgerBtn, { top: insets.top + 8 }]}
        >
          <View style={styles.hLine} />
          <View style={styles.hLine} />
          <View style={styles.hLine} />
        </Pressable>
      )}

      {/* 상단 선택/박스 영역 */}
      <View
        style={[
          styles.topArea,
          {
            top: insets.top + height * UI.OPTION_TOP_RATIO + 10,
            zIndex: drawerOpen ? 0 : 10,
          },
        ]}
      >
        {renderTopArea()}
      </View>

      {/* count 표시 */}
      {(step === STEP.THINK || step === STEP.MINING || step === STEP.RESULT) && (
        <View style={[styles.countWrap, { zIndex: drawerOpen ? 0 : 10 }]}>
          <Text style={styles.countText}>COUNT : {count}</Text>
        </View>
      )}

      {/* 메시지 */}
      {message ? (
        <View style={[styles.messageWrap, { zIndex: drawerOpen ? 0 : 10 }]}>
          <Text
            style={[
              styles.messageText,
              message === "성공" ? styles.successText : styles.failText,
            ]}
          >
            {message}
          </Text>
        </View>
      ) : null}

      {/* 히어로 */}
      <View
        style={[
          styles.heroWrap,
          {
            top: insets.top + height * UI.HERO_TOP_RATIO,
            width: heroSize,
            height: heroSize,
            left: (width - heroSize) / 2,
          },
        ]}
      >
        <Image source={heroSource} style={styles.heroImage} />
      </View>

      {/* 하단 */}
      {renderBottomArea()}

      {/* Drawer */}
      {drawerOpen && (
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer}>
            <Animated.View
              style={[
                styles.overlay,
                { opacity: overlayOpacity },
                StyleSheet.absoluteFill,
              ]}
            />
          </Pressable>

          <Animated.View
            style={[
              styles.drawer,
              {
                width: drawerWidth,
                paddingTop: insets.top + 18,
                transform: [{ translateX: drawerTranslateX }],
              },
            ]}
          >
            <Text style={styles.drawerTitle}>메뉴</Text>

            <Pressable
              onPress={() => {
                closeDrawer();
                setTimeout(() => onGoWebView?.(), 150);
              }}
              style={styles.drawerItem}
            >
              <Text style={styles.drawerItemText}>제작사 홈페이지</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /** 기본 */
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  /** 햄버거 */
  hamburgerBtn: {
    position: "absolute",
    left: 14,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  hLine: {
    width: 18,
    height: 2,
    marginVertical: 2,
    backgroundColor: "#111111",
  },

  /** 상단 영역 */
  topArea: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  /** 1단계 제목 */
  topTitleText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#111827",
  },
  /** 2단계 숫자 선택 */
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  optionButton: {
    minWidth: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  optionButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  optionButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },

  /** 박스 */
  boxRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    flexWrap: "wrap",
    paddingHorizontal: 20,
  },
  numberBox: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
  },
  numberBoxSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#dbeafe",
  },
  numberBoxRevealed: {
    borderColor: "#16a34a",
    backgroundColor: "#dcfce7",
  },
  numberBoxPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  numberBoxText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  /** count */
  countWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },

  /** 메시지 */
  messageWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 198,
    alignItems: "center",
    justifyContent: "center",
  },
  messageText: {
    fontSize: 21,
    fontWeight: "800",
  },
  successText: {
    color: "#15803d",
  },
  failText: {
    color: "#b91c1c",
  },

  /** 히어로 */
  heroWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  /** 하단 메인 버튼 */
  bottomMainButton: {
    position: "absolute",
    left: "50%",
    transform: [{ translateX: -80 }],
    width: 160,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomMainButtonPressed: {
    opacity: 0.85,
    transform: [{ translateX: -80 }, { scale: 0.98 }],
  },
  bottomMainButtonText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
  },

  /** 4단계 숫자 버튼 */
  miningNumberRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  miningNumberButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  miningNumberButtonFailed: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#dc2626",
  },
  miningNumberButtonDisabled: {
    opacity: 0.45,
  },
  miningNumberButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  miningNumberButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },

  /** Drawer */
  overlay: {
    backgroundColor: "#000000",
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    zIndex: 100,
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.08)",
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 20,
    color: "#111827",
  },
  drawerItem: {
    paddingVertical: 12,
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
});