import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Button,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function ScanScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const scanLock = useRef(false);

  // ask for camera permission
  useEffect(() => {
    (async () => {
      await requestPermission();
    })();
  }, []);

  if (permission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Requesting camera permission</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>No access to camera. Please enable camera permissions.</Text>
        <Button title={"Allow Camera"} onPress={requestPermission} />
      </View>
    );
  }

  const handleBarCodeScanned = (result: { data: string }) => {
    // prevent double scans
    if (scanLock.current) return;
    scanLock.current = true;

    setScanned(true);

    // navigate to product screen with EAN
    const ean = result.data;
    console.log("Barcode recognised:", ean);

    navigation.navigate("Product", { ean: ean, saveToHistory: true });

    // allow new scan after a short delay
    setTimeout(() => {
      scanLock.current = false;
      setScanned(false);
    }, 1500);
  };

  // return the view
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          // common retail barcode formats
          barcodeTypes: ["ean13", "ean8", "upc_e", "upc_a", "qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Point your camera at a barcode</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  overlay: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  overlayText: {
    backgroundColor: "#0009",
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
