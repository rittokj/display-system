import axios from 'axios';
import React, {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
} from 'react';
import { Text, View, Image } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import moment from 'moment-timezone';
import styles from './styles';
import { Video } from 'expo-av';

const headers = {
	'Content-Type': 'application/json',
	'X-Api-Key': process.env.EXPO_PUBLIC_API_KEY,
};

const getContainerStyle = (bgColor?: string) => ({
	backgroundColor: bgColor || '#0090FF',
});

interface DoctorData {
	doctorName?: string;
	department?: string;
	timing?: string;
	photoUrl?: string;
	mediaUrl?: string;
	bgColor?: string;
	scheduleStatus?: number;
}

interface HospitalDetails {
	hospitalName?: string;
	helpEmail?: string;
	helpPhone?: string;
	hospitalWebSite?: string;
}

const isVideoUrl = (url: string) => {
	const videoExtensions = [
		'.mp4', // Most widely used, supports high quality and compression.
		'.avi', // Uncompressed or compressed video, large file size.
		'.mkv', // Supports multiple audio and subtitle tracks.
		'.mov', // Apple QuickTime format, high quality.
		'.wmv', // Windows Media Video, smaller file sizes.
		'.flv', // Flash Video, used for web streaming.
		'.webm', // Optimized for web use, open-source.
		'.mpeg', // Older format, still in use.
		'.3gp', // Mobile-friendly format.
		'.ogv', // Open-source, used for web videos.
	];
	return videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
};

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
					defaultScreen: data.scheduleStatus === 3 || data?.isDoctor === false,
					error: data.scheduleStatus === 4,
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
		intervalRef.current = setInterval(fetchData, 5000);

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
				{doctorData?.mediaUrl ? (
					isVideoUrl(doctorData.mediaUrl) ? (
						<Video
							source={{
								uri: doctorData.mediaUrl,
							}}
							style={styles.defaultVideo}
							shouldPlay
							isLooping
							resizeMode='contain'
						/>
					) : (
						<Image
							source={{ uri: doctorData.mediaUrl }}
							style={styles.defaultImage}
							resizeMode='contain'
						/>
					)
				) : null}
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
					style={styles.bgImage}
				/>
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
