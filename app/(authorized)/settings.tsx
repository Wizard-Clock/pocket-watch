import React from 'react';
import { Appbar, Text } from 'react-native-paper'
import {useRouter} from "expo-router";
import {useAuthSession} from "@/providers/AuthService";
import {SafeAreaView} from "react-native";

export default function SettingsPage() {
    const {signOut} = useAuthSession();

    return (
        <>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => useRouter().back()} />
                <Appbar.Content title="Settings"/>
                <Appbar.Action icon="logout" onPress={signOut} />
            </Appbar.Header>
            <SafeAreaView>
                <Text>
                    Settings Tab
                </Text>
            </SafeAreaView>
        </>
    );
}
