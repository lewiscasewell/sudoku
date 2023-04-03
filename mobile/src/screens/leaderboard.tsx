import {SafeAreaView} from 'react-native-safe-area-context';
import {Text} from 'react-native';

export const LeaderboardScreen = () => {
  return (
    <SafeAreaView>
      <Text
        style={{
          color: 'white',
          fontSize: 40,
          fontWeight: 900,
          textAlign: 'center',
        }}>
        Wall of fame
      </Text>
    </SafeAreaView>
  );
};
