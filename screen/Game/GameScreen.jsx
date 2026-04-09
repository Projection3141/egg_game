import React, { useMemo, useRef, useState } from "react";
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

const UI = {
  EGG_SIZE_RATIO: 0.8,
  MAX_COUNT: 1000,
  DRAWER_WIDTH_RATIO: 0.4,
  OVERLAY_OPACITY: 0.7,
};

export default function GameScreen({ onGoWebView }) {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get("window");

  /* ==============================
   * 게임 상태
   * ============================== */
  const [count, setCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isClear, setIsClear] = useState(false);
  const lastPressTime = useRef(null);

  const eggBoxSize = useMemo(() => {
    const minSide = Math.min(width, height);
    return Math.floor(minSide * UI.EGG_SIZE_RATIO);
  }, [width, height]);

  /* ==============================
   * 달걀 클릭 로직
   * ============================== */
  const handleEggPress = () => {
    const now = Date.now();
    const diff = lastPressTime.current ? now - lastPressTime.current : Infinity;
    const nextCombo = diff <= 1000 ? combo + 1 : 1;

    lastPressTime.current = now;

    if (isClear) {
      // clear 상태에서 한 번 더 누르면 초기화
      setIsClear(false);
      setCount(0);
      setCombo(0);
      lastPressTime.current = null;
      return;
    }

    if (count >= UI.MAX_COUNT) {
      setIsClear(true);
      setCombo(0);
      return;
    }

    setCombo(nextCombo);
    setCount((prev) => prev + 1);
  };

  const resetGame = () => {
    setIsClear(false);
    setCount(0);
  };

  const label = isClear ? "clear" : String(count);

  const eggImg = isClear
    ? require("../../assets/egg_broken.png")
    : require("../../assets/egg.png");

  /* ==============================
   * Drawer 상태
   * ============================== */
  const drawerWidth = Math.floor(width * UI.DRAWER_WIDTH_RATIO);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(anim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setDrawerOpen(false));
  };

  const drawerTranslateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth, 0],
  });

  const overlayOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, UI.OVERLAY_OPACITY],
  });

  return (
    <View style={styles.container}>
      {/* ================= 햄버거 ================= */}
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

      {/* ================= 라벨 ================= */}
      <View style={[styles.labelOverlay, { zIndex: drawerOpen ? 0 : 10 }]}>
        <Text style={styles.labelText}>{label}</Text>
      </View>

      {/* ================= 달걀 ================= */}
      <View style={styles.eggWrapper}>
        {combo >= 10 && (
          <View style={styles.comboBadge} pointerEvents="none">
            <Text style={styles.comboText}>{combo} COMBO</Text>
          </View>
        )}

        <Pressable
          onPress={handleEggPress}
          style={({ pressed }) => {
            const hoverScale = combo >= 10
              ? Math.min(1.3, 1.1 + Math.floor((combo - 10) / 20) * 0.04)
              : 0.98;

            return [
              styles.eggBox,
              {
                width: eggBoxSize,
                height: eggBoxSize,
                transform: [{ scale: pressed ? hoverScale : 1 }],
              },
            ];
          }}
        >
          <Image source={eggImg} style={styles.eggImage} />
        </Pressable>
      </View>

      {/* ================= Reset 버튼 ================= */}
      <Pressable
        onPress={resetGame}
        style={[styles.resetBtn, { bottom: insets.bottom + 20 }]}
      >
        <Text style={styles.resetText}>초기화</Text>
      </Pressable>

      {/* ================= Drawer ================= */}
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
              { width: drawerWidth, transform: [{ translateX: drawerTranslateX }] },
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
  container: { flex: 1, alignItems: "center", justifyContent: "center" },

  hamburgerBtn: {
    position: "absolute",
    left: 14,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },

  hLine: {
    width: 18,
    height: 2,
    backgroundColor: "#111",
    marginVertical: 2,
  },

  labelOverlay: {
    position: "absolute",
    top: 80,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
  },

  labelText: { fontSize: 42, fontWeight: "800" },

  eggWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },

  eggBox: {
    borderRadius: 26,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  comboBadge: {
    position: "absolute",
    top: -32,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "#f59e0b",
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },

  comboText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#b45309",
  },

  eggImage: { width: "100%", height: "100%", resizeMode: "contain" },

  resetBtn: {
    position: "absolute",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#111827",
  },

  resetText: { color: "#fff", fontWeight: "700" },

  overlay: { backgroundColor: "#000" },

  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#fff",
    padding: 20,
    zIndex: 100,
  },

  drawerTitle: { fontSize: 18, fontWeight: "800", marginBottom: 20 },

  drawerItem: { paddingVertical: 12 },

  drawerItemText: { fontSize: 16, fontWeight: "600" },
});