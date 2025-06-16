/*https://medium.com/@david.ryan.hall/setting-up-a-basic-login-flow-for-an-expo-application-0b62b2b3e448*/
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {router} from "expo-router";
import {
    createContext,
    ReactNode,
    RefObject,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState
} from 'react';
import {fetch} from 'expo/fetch';

const AuthContext = createContext<{
    signIn: (url: string, username: string, password: string) => void;
    signOut: () => void
    token: RefObject<string | null> | null;
    isLoading: boolean
    genError: string
}>({
    signIn: () => null,
    signOut: () => null,
    token: null,
    isLoading: false,
    genError: "",
});

// Access the context as a hook
export function useAuthSession() {
    return useContext(AuthContext);
}

export default function AuthProvider({children}:{children: ReactNode}): ReactNode {
    const tokenRef = useRef<string|null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [genError, setGenError] = useState('');

    useEffect(() => {
        (async ():Promise<void> => {
            let tokenUse: string | null;
            if (Platform.OS === 'web') {
                tokenUse = await AsyncStorage.getItem('@token');
            } else { // mobile
                tokenUse = await SecureStore.getItemAsync('@token');
            }
            tokenRef.current = tokenUse || '';
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
                if (Platform.OS === 'web') {
                    await AsyncStorage.setItem('@token', jsonToken.token);
                } else { // mobile
                    await SecureStore.setItemAsync('token', jsonToken.token);
                }
                tokenRef.current = jsonToken;
                setIsLoading(false);
                router.replace('/');
            } else {
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
        if (Platform.OS === 'web') {
            await AsyncStorage.setItem('@token', '');
        } else { // mobile
            await SecureStore.deleteItemAsync('@token');
        }
        tokenRef.current = null;
        router.replace('/login');
    }, []);

    return (
        <AuthContext.Provider
            value={{
                signIn,
                signOut,
                token: tokenRef,
                isLoading,
                genError
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};