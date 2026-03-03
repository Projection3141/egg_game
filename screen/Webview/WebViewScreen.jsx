// /app/webview/WebViewScreen.jsx
import React, { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

/** ****************************************************************************
 * ✅ WebViewScreen
 * - 제작사 홈페이지 WebView 표시
 *
 * props:
 *  - onBack(): 게임 화면으로 돌아가기
 ******************************************************************************/

const URI = "https://www.tailorchain.xyz/";

export default function WebViewScreen({ onBack }) {
    const webRef = useRef(null);
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            {/* 상단 바 */}
            <View style={[styles.topBar, { paddingTop: insets.top }]}>
                <Pressable
                    onPress={onBack}
                    style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
                    hitSlop={10}
                >
                    <Text style={styles.backText}>←</Text>
                </Pressable>

                <Text style={styles.title}>제작사 홈페이지</Text>

                {/* 우측 여백(센터 정렬용) */}
                <View style={{ width: 44 }} />
            </View>

            <WebView
                ref={webRef}
                source={{ uri: URI }}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                setSupportMultipleWindows={false}
                style={styles.webview}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFFFFF" },

    topBar: {
        height: 56 + 20,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.08)",
        backgroundColor: "#FFFFFF",
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    backText: { fontSize: 20, fontWeight: "900", color: "#111827" },
    title: { fontSize: 16, fontWeight: "800", color: "#111827" },

    webview: { flex: 1 },
});