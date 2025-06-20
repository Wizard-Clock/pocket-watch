import {useAuthSession} from "@/providers/AuthService";
import {Redirect, Stack} from 'expo-router';
import {ActivityIndicator} from 'react-native-paper';
import {ReactNode} from "react";
import LocationProvider from "@/providers/LocationService";

export default function RootLayout(): ReactNode {
    const {token, isLoading} = useAuthSession();

    if (isLoading) {
        return <ActivityIndicator animating={true} size={"large"}/>;
    }

    if (!token?.current) {
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

