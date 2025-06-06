import {useAuthSession} from "@/providers/Auth";
import {ReactNode, useState} from "react";
import {TextInput} from 'react-native-paper';
import {Button, Image, View} from "react-native";

export default function Login(): ReactNode {
    const {signIn} = useAuthSession();
    const [url, setURL] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const login = ():void => {
        signIn(url, {username, password});
    }

    return (
        <View
            style={{
                flex: 1,
                justifyContent: "flex-start",
                alignItems: "center",
            }}
        >
            <Image
                style={{
                    marginTop:200,
                    height:60,
                    width:350
                }}
                source={require("@/assets/images/login-full-logo.png")}
            />
            <TextInput
                style={{
                    marginTop: 30,
                    width:320,
                    height:40
                }}
                mode="outlined"
                label="Server URL"
                onChangeText={newUrl => setURL(newUrl)}
                defaultValue={url}
            />
            <TextInput
                style={{
                    marginTop: 30,
                    width:320,
                    height:40
                }}
                mode="outlined"
                label="Username"
                onChangeText={newUsername => setUsername(newUsername)}
                defaultValue={username}
            />
            <TextInput
                style={{
                    marginTop: 30,
                    marginBottom:30,
                    width:320,
                    height:40
                }}
                mode="outlined"
                label="Password"
                secureTextEntry={true}
                onChangeText={newPassword => setPassword(newPassword)}
                defaultValue={password}
            />
            <Button
                title="Log In"
                onPress={login}
            />
        </View>
    );
}
