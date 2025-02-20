import axios from 'axios';
import React, {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
} from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import moment from 'moment-timezone';

const headers = {
	'Content-Type': 'application/json',
	'X-Api-Key': process.env.EXPO_PUBLIC_API_KEY,
};

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

const getContainerStyle = (bgColor?: string) => ({
	backgroundColor: bgColor || '#0090FF',
});

interface DoctorData {
	doctorName?: string;
	department?: string;
	timing?: string;
	photoUrl?: string;
	bgColor?: string;
	scheduleStatus?: number;
}

interface HospitalDetails {
	hospitalName?: string;
	helpEmail?: string;
	helpPhone?: string;
	hospitalWebSite?: string;
}

export default function App() {
	const [appState, setAppState] = useState({
		connected: false,
		defaultScreen: false,
		error: false,
	});

	const [deviceId, setDeviceId] = useState<string | null>(null);
	const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
	const [hospitalDetails, setHospitalDetails] =
		useState<HospitalDetails | null>(null);

	const intervalRef = useRef<NodeJS.Timeout>();
	const deviceIdRef = useRef<string | null>(null);
	const abortControllerRef = useRef<AbortController>();

	const timeFormat = useMemo(() => 'HH:mm', []);

	const getCurrentTimeSpan = useCallback(() => {
		return moment().tz('Asia/Dubai').format(timeFormat) + ':00';
	}, [timeFormat]);

	const fetchData = useCallback(async () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		abortControllerRef.current = new AbortController();

		try {
			const dId = deviceIdRef.current;
			if (!dId) {
				console.log('No device ID found');
				return;
			}

			const hospital = await SecureStore.getItemAsync('hospitalDetails');
			const currentTime = getCurrentTimeSpan();
			const url = `${process.env.EXPO_PUBLIC_BASE_URL}?deviceCode=${dId}&currentTime=${currentTime}`;

			const response = await axios.get(url, {
				headers,
				signal: abortControllerRef.current.signal,
			});

			if (response.status !== 200) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const { data, status } = response;

			setAppState((prev) => {
				const newState = {
					...prev,
					connected: data.scheduleStatus === 1,
					defaultScreen: data.scheduleStatus === 3,
					error: data.scheduleStatus === 3 || data.scheduleStatus === 4,
				};
				return newState;
			});

			setDoctorData(data.scheduleStatus === 1 ? data : null);

			if (!hospital || JSON.stringify(data) !== hospital) {
				const newHospitalDetails: HospitalDetails = {
					helpEmail: data?.helpEmail || '',
					helpPhone: data?.helpPhone || '',
					hospitalName: data?.hospitalName || '',
					hospitalWebSite: data?.hospitalWebSite || '',
				};

				await SecureStore.setItemAsync(
					'hospitalDetails',
					JSON.stringify(newHospitalDetails)
				);
				setHospitalDetails(newHospitalDetails);
			}
		} catch (err) {
			if (!axios.isCancel(err)) {
				setAppState((prev) => ({
					...prev,
					error: true,
				}));
			}
		}
	}, [getCurrentTimeSpan]);

	const initializeDevice = useCallback(async () => {
		try {
			const [deviceIdResult, hospitalResult] = await Promise.all([
				SecureStore.getItemAsync('deviceId'),
				SecureStore.getItemAsync('hospitalDetails'),
			]);

			if (hospitalResult) {
				setHospitalDetails(JSON.parse(hospitalResult));
			}

			const id =
				deviceIdResult ||
				Math.floor(Math.random() * 899999 + 100000).toString();
			if (!deviceIdResult) {
				await SecureStore.setItemAsync('deviceId', id);
			}

			setDeviceId(id);
			deviceIdRef.current = id;
			fetchData();
		} catch (e) {
			setAppState((prev) => ({
				...prev,
				error: true,
			}));
		}
	}, [fetchData]);

	useEffect(() => {
		initializeDevice();

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
			if (abortControllerRef.current) abortControllerRef.current.abort();
		};
	}, [initializeDevice]);

	useEffect(() => {
		if (!deviceId) return;

		if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}

		// intervalRef.current = setInterval(fetchData, 60000);
		intervalRef.current = setInterval(fetchData, 10000);

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [deviceId, fetchData]);

	useEffect(() => {
		if (!deviceId) return;
	}, [deviceId]);

	const renderDigitBoxes = useMemo(
		() =>
			deviceId?.split('').map((digit, index) => (
				<View
					key={index}
					style={styles.digitBox}>
					<Text style={styles.digit}>{digit}</Text>
				</View>
			)),
		[deviceId]
	);

	const errorText = useMemo(
		() =>
			`Email: ${hospitalDetails?.helpEmail || ''} | Phone: ${
				hospitalDetails?.helpPhone || ''
			}`,
		[hospitalDetails?.helpEmail, hospitalDetails?.helpPhone]
	);

	if (appState.defaultScreen) {
		return (
			<View style={styles.defaultImageContainer}>
				<Image
					source={require('../assets/images/default.jpeg')}
					style={styles.defaultImage}></Image>
			</View>
		);
	}

	if (!appState.connected && !appState.error && !appState.defaultScreen) {
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
				<View style={styles.codeContainer}>{renderDigitBoxes}</View>
			</View>
		);
	}

	if (appState.error && !doctorData?.doctorName) {
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
					{errorText}
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
				style={[styles.leftSection, getContainerStyle(doctorData?.bgColor)]}>
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
							{hospitalDetails?.hospitalWebSite || ''}
						</Text>
					</View>
				</View>
			</View>
			<View style={styles.rightSection}>
				<Image
					source={{ uri: doctorData?.photoUrl || '' }}
					style={styles.image}
				/>
			</View>
		</View>
	);
}
