import {SafeAreaView} from 'react-native-safe-area-context';
import {Alert, Button, Text, View} from 'react-native';
import {storage, supabase} from '../supabase';

export const ProfileScreen = () => {
  const user = JSON.parse(
    storage.getString('sb-cpcougvkweklrhuvxyqh-auth-token') ?? '',
  );
  console.log(
    'hello mmkv',
    storage.getString('sb-cpcougvkweklrhuvxyqh-auth-token'),
  );
  async function signOut() {
    const {error} = await supabase.auth.signOut();
    if (error) Alert.alert(error.message);
  }
  return (
    <SafeAreaView>
      <Text
        style={{
          color: 'white',
          fontSize: 40,
          fontWeight: 900,
          textAlign: 'center',
        }}>
        Profile
      </Text>
      <View>
        <Text style={{color: 'white'}}>Welcome {user.user.email}</Text>
      </View>

      <Button title="sign out" onPress={() => signOut()} />
    </SafeAreaView>
  );
};
