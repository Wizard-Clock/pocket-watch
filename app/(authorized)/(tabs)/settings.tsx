import {useAuthSession} from "@/providers/Auth";
import {useState} from "react";
import { Button, Text, View, StyleSheet } from 'react-native';

export default function SettingsScreen() {
  const {signOut, token} = useAuthSession();
  const [tokenInUi, setTokenInUi] = useState<null|string|undefined>(null);

  const logout = () => {
    signOut();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings screen</Text>
      <Button title={"Logout"} onPress={logout}/>
      <View style={{
        paddingTop: 20
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
  },
});
