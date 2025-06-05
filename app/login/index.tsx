import {useAuthSession} from "@/providers/Auth";
import Uuid from "expo-modules-core/src/uuid";
import {ReactNode} from "react";
import {Button, Text, TextInput, View} from "react-native";

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
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Text>Server URL:</Text>
            <TextInput
                placeholder="Enter URL"
            />
            <Text>Username:</Text>
            <TextInput
                placeholder="Enter username"
            />
            <Text>Password:</Text>
            <TextInput
                secureTextEntry={true}
            />
            <Button
                title={"Log In"}
                onPress={login}
            />
        </View>
    );
}
