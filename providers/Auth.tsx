/*https://medium.com/@david.ryan.hall/setting-up-a-basic-login-flow-for-an-expo-application-0b62b2b3e448*/
import AsyncStorage from '@react-native-async-storage/async-storage';
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
            const token = await AsyncStorage.getItem('@token');
            tokenRef.current = token || '';
            setIsLoading(false);
        })()
    }, []);

    const signIn = useCallback(async (url: string, username: string, password: string) => {
        setIsLoading(true);
        setGenError('');

        //Setup Connection Timeout
        let controller = new AbortController();
        setTimeout(() => {controller.abort()}, 10000);

        try {
            // POST to server
            const response = await fetch(url+"/api/login/", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Access-Control-Allow-Origin': '*/',
                    'Access-Control-Allow-Credentials': 'true'
                },
                body: JSON.stringify({username: username, password: password}),
                signal: controller.signal
            });

            if (response.ok) {
                const token = await response.json();
                console.log('response', response);
                await AsyncStorage.setItem('@token', JSON.parse(token.json()));
                tokenRef.current = token;
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
                console.log('response', response);
                setIsLoading(false);
                router.replace('/login');
            }
        } catch (err) {
            setIsLoading(false);
            if (err instanceof Error) {
                console.log('error', err.name);
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
        await AsyncStorage.setItem('@token', '');
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