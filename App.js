// App.js
import React, { useCallback, useState } from "react";
import { View, StyleSheet, LogBox } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import GameScreen from "./screen/Game/GameScreen";
import WebViewScreen from "./screen/Webview/WebViewScreen";

/** ****************************************************************************
 * ✅ SafeAreaView 제거
 * - SafeAreaProvider + 각 화면에서 insets 사용
 ******************************************************************************/

LogBox.ignoreAllLogs(true);

export default function App() {
  const [screen, setScreen] = useState("game");

  const goWebView = useCallback(() => {
    setScreen("webview");
  }, []);

  const goGame = useCallback(() => {
    setScreen("game");
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {screen === "game" ? (
          <GameScreen onGoWebView={goWebView} />
        ) : (
          <WebViewScreen onBack={goGame} />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
});