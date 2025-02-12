import axios from "axios";
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Image } from "react-native";

export default function App() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [doctorData, setDoctorData] = useState(null);

  useEffect(() => {
    const generateDeviceId = () => {
      // Generate random 8 digit number
      const min = 100000; // Smallest 8 digit number
      const max = 999999; // Largest 8 digit number
      const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
      return randomNum.toString();
    };
    const getDeviceId = async () => {
      try {
        const id = generateDeviceId();
        setDeviceId(id);
        fetchData(id);
        //Send device ID to backend here (e.g., using fetch or axios)
      } catch (e) {}
    };
    getDeviceId();
    // setTimeout(() => {
    //   setConnected(true);
    //   setTimeout(() => {
    //     setDoctorData(null);
    //     setTimeout(() => {
    //       setError(true);
    //     }, 5000);
    //   }, 5000);
    // }, 5000);
  }, []);

  const fetchData = async (deviceId) => {
    try {
      const response = await axios.get(
        `http://64.227.148.163:81/api/ScreenSchedule/GetScheduleDetailByDevice?deviceCode=${deviceId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": "12345ABCDE67890FGHIJ",
          },
        }
      ); // Replace with your API endpoint

      if (response.status !== 200) {
        setError(true);
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        if (response.data.scheduleStatus === 1) setConnected(true);
        else if (response.data.scheduleStatus === 2) {
          setConnected(false);
          setDoctorData(null);
        } else if (response.data.scheduleStatus === 3) {
          setConnected(false);
          setDoctorData(null);
          setError(true);
        } else if (response.data.scheduleStatus === 4) {
          setConnected(false);
          setDoctorData(null);
          setError(true);
        }
      }
      const data = await response.data;
      setDoctorData(data);
      setError(null);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    if (connected) {
      let intervalId;
      if (doctorData?.doctorName) {
        intervalId = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 minutes
      } else {
        intervalId = setInterval(fetchData, 1 * 60 * 1000); // Retry every 1 minute if no data
      }
      return () => clearInterval(intervalId); // Clear interval on unmount
    }
  }, [connected, doctorData?.doctorName]);

  if (!connected) {
    return (
      <View style={styles.centralizedContainer}>
        <Text
          style={[
            styles.optSubtitle,
            { position: "absolute", top: 40, left: 40 },
          ]}
        >
          DRFK Turkish International DSC
        </Text>
        <Text style={styles.optTitle}>Enter code</Text>
        <Text style={styles.optSubtitle}>
          Enter this code in the back office to connect the device
        </Text>
        <View style={styles.codeContainer}>
          {deviceId?.split("").map((digit, index) => (
            <View key={index} style={styles.digitBox}>
              <Text style={styles.digit}>{digit}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error && !doctorData?.doctorName) {
    return (
      <View style={styles.errorContainer}>
        <Text
          style={[
            styles.optSubtitle,
            { position: "absolute", top: 40, left: 40 },
          ]}
        >
          DRFK Turkish International DSC
        </Text>
        <Text style={styles.optTitle}>Internal Server Error</Text>
        <Text
          style={{
            fontSize: 24,
            marginBottom: 16,
            fontFamily: "InterRegular",
            color: "#fff",
          }}
        >
          Please Contact Administrator
        </Text>
        <Text
          style={{
            fontSize: 18,
            marginBottom: 16,
            fontFamily: "InterLight",
            color: "#fff",
          }}
        >
          Email: service@abcd.com | Phone: +971-50-1234567
        </Text>
      </View>
    );
  }

  if (!doctorData?.doctorName) {
    return (
      <View style={styles.centralizedContainer}>
        <Text
          style={[
            styles.optSubtitle,
            { position: "absolute", top: 40, left: 40 },
          ]}
        >
          DRFK Turkish International DSC
        </Text>
        <Text style={styles.optTitle}>Screen is empty</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.leftSection,
          { backgroundColor: doctorData?.bgColor || "#0090FF" },
        ]}
      >
        <Image
          source={require("../assets/images/line.png")}
          style={styles.bgImage}
        ></Image>
        <View
          style={{
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 40,
            paddingRight: 80,
          }}
        >
          <View style={{}}>
            <Text style={styles.lightText}>DRFK Turkish International DSC</Text>
          </View>
          <View style={{}}>
            <Text
              style={{
                fontSize: 48,
                fontWeight: "bold",
                fontFamily: "InterBold",
                color: "#fff",
                paddingBottom: 10,
              }}
            >
              {doctorData.doctorName}
            </Text>
            <Text style={[styles.lightText, { paddingBottom: 20 }]}>
              {doctorData.department || "// Orthopedic Specialist"}
            </Text>
            <View
              style={{
                flexDirection: "row",
                borderTopColor: "#3FD2FF",
                borderTopWidth: 1,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: "#3FD2FF",
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: "Inter",
                    textAlign: "center",
                    fontSize: 24,
                  }}
                >
                  Doctor in
                </Text>
              </View>
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "Inter",
                  textAlign: "right",
                  flex: 1,
                  fontSize: 24,
                }}
              >
                {doctorData.timings || "// 10:00 AM - 12:30 PM"}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: "Inter",
                color: "#fff",
                paddingTop: 30,
                lineHeight: 24,
                letterSpacing: 0.5,
              }}
            >
              www.drfkinternational.com
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.rightSection}>
        <Image source={{ uri: doctorData.photoUrl }} style={styles.image} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff",
  },
  leftSection: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#0090FF",
  },
  rightSection: {
    width: "40%",
    justifyContent: "center",
    alignItems: "center",
  },
  bgImage: {
    transform: [{ rotate: "-10deg" }],
    position: "absolute",
    width: "240%",
    height: "120%",
    left: -60,
    top: 10,
    objectFit: "fill",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  unoccupiedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centralizedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    padding: 40,
    position: "relative",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#000",
    padding: 40,
    position: "relative",
  },
  optTitle: {
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 16,
    fontFamily: "InterBold",
    color: "#fff",
  },
  optSubtitle: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 32,
    maxWidth: 400,
    color: "#FFF",
    fontFamily: "InterLight",
  },
  lightText: {
    fontSize: 24,
    color: "#FFF",
    fontFamily: "InterLight",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    fontFamily: "InterBold",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    maxWidth: 300,
    color: "#666",
    fontFamily: "Inter",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  digitBox: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  digit: {
    fontSize: 50,
    fontFamily: "Inter",
    color: "#fff",
  },
});
