import AuthProvider from "@/providers/AuthService";
import {Slot} from "expo-router";
import {ReactNode, StrictMode} from "react";
import SettingsService from "@/providers/SettingsService";
import {PaperProvider} from "react-native-paper";

export default function RootLayout(): ReactNode {
    SettingsService.getInstance();
    return (
        <StrictMode>
            <PaperProvider>
                <AuthProvider>
                    <Slot />
                </AuthProvider>
            </PaperProvider>
        </StrictMode>
    );
};
