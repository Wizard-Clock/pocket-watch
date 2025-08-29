/*https://medium.com/@david.ryan.hall/setting-up-a-basic-login-flow-for-an-expo-application-0b62b2b3e448*/
import * as SecureStore from 'expo-secure-store';
import {router} from "expo-router";
import {createContext, ReactNode, RefObject, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {fetch} from 'expo/fetch';
import SettingsService from "@/providers/SettingsService";

const WC_API_TOKEN_KEY = 'portkey';
const AuthContext = createContext<{
    signIn: (url: string, username: string, password: string) => void;
    signOut: () => void
    token: RefObject<string | null> | null;
    isValidCredentials: boolean
    isLoading: boolean
    genError: string
}>({
    signIn: () => null,
    signOut: () => null,
    token: null,
    isValidCredentials: false,
    isLoading: false,
    genError: "",
});

// Access the context as a hook
export function useAuthSession() {
    return useContext(AuthContext);
}

export default function AuthProvider({children}:{children: ReactNode}): ReactNode {
    const settingsService = SettingsService.getInstance();
    const tokenRef = useRef<string|null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isValidCredentials, setIsValidCredentials] = useState(true);
    const [genError, setGenError] = useState('');

    useEffect(() => {
        (async ():Promise<void> => {
            await SecureStore.getItemAsync(WC_API_TOKEN_KEY).then(result => {
                if (result) {
                    // @ts-ignore
                    tokenRef.current = {
                        token: result
                    };
                } else {
                    tokenRef.current = '';
                }
            });
            if (tokenRef.current !== '') {
                await verifyCredentials();
            }
            setIsLoading(false);
        })()
    }, []);

    const signIn = useCallback(async (url: string, username: string, password: string) => {
        setIsLoading(true);
        setGenError('');

        //Setup Connection Timeout
        let controller = new AbortController();
        setTimeout(() => {controller.abort()}, 10000);
        interface UserInterface {
            username: string;
            password: string;
        }

        const userObj: UserInterface = {
            username: username,
            password: password,
        };

        try {
            // POST to server
            const response = await fetch(url+"/api/login", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': 'true'
                },
                body: JSON.stringify(userObj),
                signal: controller.signal,
            });

            if (response.ok) {
                const jsonToken = await response.json();
                await SecureStore.setItemAsync(WC_API_TOKEN_KEY, jsonToken.token);
                tokenRef.current = jsonToken;
                settingsService.set("url", url);
                settingsService.set("username", username);
                setIsValidCredentials(true);
                setIsLoading(false);
                router.replace('/');
            } else {
                setIsValidCredentials(false);
                switch (response.status) {
                    case 401:
                        setGenError('401: Invalid token.');
                        break;
                    case 404:
                        setGenError('404: URL not found.');
                        break;
                }
                setIsLoading(false);
                router.replace('/login');
            }
        } catch (err) {
            setIsValidCredentials(false);
            setIsLoading(false);
            if (err instanceof Error) {
                console.log('error', err);
                if (err.name.includes("AbortError")) {
                    setGenError("Connection attempt took too long.");
                } else {
                    setGenError("Failed to Fetch.");
                }
            }
            router.replace('/login');
        }
    }, []);

    const signOut = useCallback(async () => {
        await SecureStore.deleteItemAsync(WC_API_TOKEN_KEY);
        setIsLoading(false);
        tokenRef.current = null;
        router.replace('/login');
    }, []);

    const verifyCredentials = useCallback(async () => {
        // @ts-ignore
        let tokenVal = tokenRef?.current.token;
        const response = await fetch(settingsService.getSettingValue("url") + "/api/credentialCheck", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': 'true',
                "Authorization": "Bearer " + tokenVal
            },
            body: JSON.stringify({
                username: settingsService.getSettingValue("username")
            })
        });

        if (response.ok) {
            setIsValidCredentials(true);
            setGenError("");
        } else {
            setIsValidCredentials(false);
            setGenError("Credentials Expired");
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                signIn,
                signOut,
                token: tokenRef,
                isValidCredentials,
                isLoading,
                genError
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};