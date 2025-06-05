import {useAuthSession} from "@/providers/Auth";
import {Redirect, Stack} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {Text} from 'react-native';
import {ReactNode} from "react";

export default function RootLayout(): ReactNode {
    const {token, isLoading} = useAuthSession()

    if (isLoading) {
        return <Text>Loading...</Text>;
    }

    if (!token?.current) {
        return <Redirect href="/login" />;
    }

    return (
        <>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="light" />
        </>
    );
}
