import {useAuthSession} from "@/providers/Auth";
import Uuid from "expo-modules-core/src/uuid";
import {ReactNode} from "react";
import {TextInput} from 'react-native-paper';
import {Button, Image, View} from "react-native";

export default function Login(): ReactNode {
    const {signIn} = useAuthSession();
    const login = ():void => {
        const random: string = Uuid.v4();
        signIn(random);
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
            />
            <TextInput
                style={{
                    marginTop: 30,
                    width:320,
                    height:40
                }}
                mode="outlined"
                label="Username"
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
            />
            <Button
                title="Log In"
                onPress={login}
            />
        </View>
    );
}
