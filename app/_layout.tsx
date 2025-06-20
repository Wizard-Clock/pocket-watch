import AuthProvider from "@/providers/AuthService";
import {Slot} from "expo-router";
import {ReactNode, StrictMode} from "react";
import SettingsService from "@/providers/SettingsService";

export default function RootLayout(): ReactNode {
    SettingsService.getInstance();
    return (
        <StrictMode>
            <AuthProvider>
                    <Slot />
            </AuthProvider>
        </StrictMode>
    );
};
