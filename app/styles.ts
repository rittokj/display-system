import { StyleSheet } from 'react-native';

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
	defaultVideo: {
		width: '100%',
		height: '100%',
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

export default styles;
