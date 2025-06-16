import {useRouter} from "expo-router";
import {Appbar, Text} from "react-native-paper";
import {useAuthSession} from "@/providers/Auth";
import React from "react";

export default function Settings() {
    const router = useRouter();
    const {signOut} = useAuthSession();

    return (
        <>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.navigate('/')} />
                <Appbar.Content title="Pocket Watch"/>
                <Appbar.Action icon="logout" onPress={signOut} />
            </Appbar.Header>
            <Text>Settings BBY</Text>
        </>
    )
}