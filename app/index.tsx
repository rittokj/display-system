import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const headers = {
	'Content-Type': 'application/json',
	'X-Api-Key': process.env.EXPO_PUBLIC_API_KEY,
};

const isCurrentTimeBetween = (fromTime: string, toTime: string) => {
	// Get the current date and time
	const now = new Date();
	// Split the time strings into hours, minutes, and seconds
	const [fromHour, fromMinute, fromSecond] = fromTime.split(':').map(Number);
	const [toHour, toMinute, toSecond] = toTime.split(':').map(Number);
	// Create Date objects for the fromTime and toTime
	const fromDateTime = new Date();
	fromDateTime.setHours(fromHour, fromMinute, fromSecond, 0);
	const toDateTime = new Date();
	toDateTime.setHours(toHour, toMinute, toSecond, 0);
	// Check if current time is between the fromTime and toTime
	return now >= fromDateTime && now <= toDateTime;
};

const getCurrentTimeSpan = () => {
	const now = new Date();
	const uaeTime = new Intl.DateTimeFormat('en-US', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		timeZone: 'Asia/Dubai', // UAE Timezone
	}).format(now);
	// Set seconds to 00
	return uaeTime.substring(0, 5) + ':00'; // "HH:mm:ss"
};

export default function App() {
	const [deviceId, setDeviceId] = useState<string | null>(null);
	const [connected, setConnected] = useState(false);
	const [defaultScreen, setDefaultScreen] = useState(false);
	const [error, setError] = useState(false);
	const [doctorData, setDoctorData] = useState(null);
	const [hospitalDetails, setHospitalDetails] = useState(null);
	const deviceIdRef = useRef(null);
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
				let result = await SecureStore.getItemAsync('deviceId');
				let hospital = await SecureStore.getItemAsync('hospitalDetails');
				if (hospital) setHospitalDetails(JSON.parse(hospital));
				const id = result || generateDeviceId();
				if (!result) await SecureStore.setItemAsync('deviceId', id);
				setDeviceId(id);
				deviceIdRef.current = id;
				fetchData();
				//Send device ID to backend here (e.g., using fetch or axios)
			} catch (e) {}
		};
		getDeviceId();
	}, []);

	const fetchData = async () => {
		try {
			let dId = deviceIdRef.current;
			let hospital = await SecureStore.getItemAsync('hospitalDetails');
			const url = `${
				process.env.EXPO_PUBLIC_BASE_URL
			}?deviceCode=${dId}&currentTime=${getCurrentTimeSpan()}`;
			const { data, status } = await axios.get(url, { headers }); // Replace with your API endpoint
			if (status !== 200) {
				setError(true);
				throw new Error(`HTTP error! status: ${status}`);
			} else {
				if (data.scheduleStatus === 1) {
					if (
						data?.fromTime &&
						data?.toTime &&
						isCurrentTimeBetween(data?.fromTime, data?.toTime)
					) {
						setConnected(true);
						setDefaultScreen(false);
					} else {
						setDefaultScreen(true);
					}
				} else if (data.scheduleStatus === 2) {
					setConnected(false);
					setDoctorData(null);
					setDefaultScreen(false);
				} else if (data.scheduleStatus === 3) {
					setConnected(false);
					setDoctorData(null);
					setDefaultScreen(true);
					setError(true);
				} else if (data.scheduleStatus === 4) {
					setConnected(false);
					setDefaultScreen(false);
					setDoctorData(null);
					setError(true);
				}
			}
			if (!hospital || JSON.stringify(data) !== JSON.stringify(hospital)) {
				await SecureStore.setItemAsync(
					'hospitalDetails',
					JSON.stringify({
						helpEmail: data?.helpEmail,
						helpPhone: data?.helpPhone,
						hospitalName: data?.hospitalName,
						bgColour: data?.bgColour,
						hospitalWebSite: data?.hospitalWebSite,
						roomName: data?.roomName,
					})
				);
				setDoctorData(data);
			}
			setError(false);
		} catch (err) {
			setError(err);
		}
	};

	useEffect(() => {
		if (deviceId) {
			let intervalId;
			intervalId = setInterval(fetchData, 1 * 60 * 1000); // Retry every 1 minute if no data
			return () => clearInterval(intervalId); // Clear interval on unmount
		}
	}, [deviceId]);

	if (defaultScreen) {
		return (
			<View style={styles.defaultImageContainer}>
				<Image
					source={require('../assets/images/default.jpeg')}
					style={styles.defaultImage}></Image>
			</View>
		);
	}

	if (!connected) {
		return (
			<View style={styles.centralizedContainer}>
				<Text
					style={[
						styles.optSubtitle,
						{ position: 'absolute', top: 40, left: 40 },
					]}>
					{hospitalDetails?.hospitalName}
				</Text>
				<Text style={styles.optTitle}>Enter code</Text>
				<Text style={styles.optSubtitle}>
					Enter this code in the back office to connect the device
				</Text>
				<View style={styles.codeContainer}>
					{deviceId?.split('').map((digit, index) => (
						<View
							key={index}
							style={styles.digitBox}>
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
						{ position: 'absolute', top: 40, left: 40 },
					]}>
					{hospitalDetails?.hospitalName}
				</Text>
				<Text style={styles.optTitle}>Internal Server Error</Text>
				<Text
					style={{
						fontSize: 24,
						marginBottom: 16,
						fontFamily: 'InterRegular',
						color: '#fff',
					}}>
					Please Contact Administrator
				</Text>
				<Text
					style={{
						fontSize: 18,
						marginBottom: 16,
						fontFamily: 'InterLight',
						color: '#fff',
					}}>
					{`Email: ${hospitalDetails?.helpEmail || ''} | Phone: ${
						hospitalDetails?.helpPhone || ''
					}`}
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
						{ position: 'absolute', top: 40, left: 40 },
					]}>
					{hospitalDetails?.hospitalName}
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
					{ backgroundColor: doctorData?.bgColor || '#0090FF' },
				]}>
				<Image
					source={require('../assets/images/line.png')}
					style={styles.bgImage}></Image>
				<View
					style={{
						flex: 1,
						flexDirection: 'column',
						justifyContent: 'space-between',
						padding: 40,
						paddingRight: 60,
					}}>
					<View>
						<Text style={styles.lightText}>
							{hospitalDetails?.hospitalName}
						</Text>
					</View>
					<View>
						<Text
							style={{
								fontSize: 48,
								fontWeight: 'bold',
								fontFamily: 'InterBold',
								color: '#fff',
								paddingBottom: 10,
							}}>
							{doctorData.doctorName}
						</Text>
						<Text style={[styles.lightText, { paddingBottom: 20 }]}>
							{doctorData.department}
						</Text>
						<View
							style={{
								flexDirection: 'row',
								borderTopColor: '#3FD2FF',
								borderTopWidth: 1,
								alignItems: 'center',
							}}>
							<View
								style={{
									backgroundColor: '#3FD2FF',
									paddingHorizontal: 20,
									paddingVertical: 10,
									justifyContent: 'center',
								}}>
								<Text
									style={{
										color: '#fff',
										fontFamily: 'Inter',
										textAlign: 'center',
										fontSize: 24,
									}}>
									Doctor in
								</Text>
							</View>
							<Text
								style={{
									color: '#fff',
									fontFamily: 'Inter',
									textAlign: 'right',
									flex: 1,
									fontSize: 24,
								}}>
								{doctorData.timing}
							</Text>
						</View>
						<Text
							style={{
								fontFamily: 'Inter',
								color: '#fff',
								paddingTop: 30,
								lineHeight: 24,
								letterSpacing: 0.5,
							}}>
							{hospitalDetails.hospitalWebSite}
						</Text>
					</View>
				</View>
			</View>
			<View style={styles.rightSection}>
				<Image
					source={{ uri: doctorData.photoUrl }}
					style={styles.image}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		backgroundColor: '#fff',
	},
	leftSection: {
		flex: 1,
		justifyContent: 'center',
		backgroundColor: '#0090FF',
	},
	rightSection: {
		width: '40%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	bgImage: {
		transform: [{ rotate: '-10deg' }],
		position: 'absolute',
		width: '240%',
		height: '120%',
		left: -60,
		top: 10,
		objectFit: 'fill',
	},
	image: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},
	defaultImageContainer: {
		flex: 1,
		flexDirection: 'row',
		backgroundColor: '#000',
	},
	defaultImage: {
		width: '100%',
		height: '100%',
		resizeMode: 'contain',
	},
	unoccupiedContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	centralizedContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#000',
		padding: 40,
		position: 'relative',
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		backgroundColor: '#000',
		padding: 40,
		position: 'relative',
	},
	optTitle: {
		fontSize: 40,
		fontWeight: 'bold',
		marginBottom: 16,
		fontFamily: 'InterBold',
		color: '#fff',
	},
	optSubtitle: {
		fontSize: 24,
		textAlign: 'center',
		marginBottom: 32,
		maxWidth: 400,
		color: '#FFF',
		fontFamily: 'InterLight',
	},
	lightText: {
		fontSize: 24,
		color: '#FFF',
		fontFamily: 'InterLight',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
		fontFamily: 'InterBold',
	},
	subtitle: {
		fontSize: 16,
		textAlign: 'center',
		marginBottom: 32,
		maxWidth: 300,
		color: '#666',
		fontFamily: 'Inter',
	},
	codeContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 8,
	},
	digitBox: {
		width: 90,
		height: 90,
		borderRadius: 12,
		backgroundColor: '#111',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#E0E0E0',
	},
	digit: {
		fontSize: 50,
		fontFamily: 'Inter',
		color: '#fff',
	},
});
