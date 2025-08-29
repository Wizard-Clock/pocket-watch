import {useAuthSession} from "@/providers/AuthService";
import {Redirect, Stack} from 'expo-router';
import {ActivityIndicator} from 'react-native-paper';
import {SafeAreaView} from "react-native";
import {ReactNode} from "react";
import LocationProvider from "@/providers/LocationService";
import Colors from "@/components/colorPalette";

export default function RootLayout(): ReactNode {
    const {token, isLoading, isValidCredentials} = useAuthSession();

    if (isLoading) {
        return (
            <SafeAreaView
                style={{
                    backgroundColor: Colors.background
                }}
            >
                <ActivityIndicator
                    animating={true}
                    size={"large"}
                    style={{}}
                />
            </SafeAreaView>
        );
    }

    if (!token?.current || !isValidCredentials) {
        return <Redirect href="/login" />;
    }

    return (
        <LocationProvider>
            <Stack
                screenOptions={{
                    headerShown: false
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="settings" />
            </Stack>
        </LocationProvider>
    );
}

