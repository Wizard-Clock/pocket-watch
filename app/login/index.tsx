import {useAuthSession} from "@/providers/AuthService";
import {TextInput, Button, Text} from 'react-native-paper';
import * as yup from 'yup';
import {useForm, Controller} from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {ActivityIndicator, Image, SafeAreaView} from "react-native";
import {ReactNode} from "react";
import Colors from '@/components/colorPalette'

export default function Login(): ReactNode {
    let url;
    let username;
    let password;
    const loginSchema = yup.object().shape({
        url: yup
            .string()
            .required('URL is required'),
        username: yup
            .string()
            .required('Username is required'),
        password: yup
            .string()
            .required('Password is required')
    });
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(loginSchema),
        defaultValues: {
            url: '',
            username: '',
            password: ''
        },
    });
    const {signIn, isLoading, genError} = useAuthSession();
    const onPressSend = (formData: { url: string; username: string; password: string; }) => {
        signIn(formData.url, formData.username, formData.password);
    };

    return (
        <SafeAreaView
            style={{
                flex: 1,
                justifyContent: "flex-start",
                alignItems: "center",
                backgroundColor: Colors.background
            }}
        >
            <Image
                style={{
                    marginTop:200,
                    height:60,
                    width:350
                }}
                source={require("@/assets/images/login-full-logo.png")}
            />
            <ActivityIndicator
                animating={isLoading}
                size="large"
                color={Colors.primary}
            />
            {genError!=="" && <Text>{genError}</Text>}
            <Controller
                control={control}
                rules={{
                    required: true,
                }}
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        style={{
                            marginTop: 30,
                            width:320,
                            height:40,
                            backgroundColor: Colors.background,
                            color: Colors.primary
                        }}
                        autoCapitalize="none"
                        mode="outlined"
                        label="Server URL"
                        activeOutlineColor={Colors.primary}
                        outlineColor={Colors.primary}
                        textColor={Colors.primary}
                        disabled={isLoading}
                        onChangeText={onChange}
                        defaultValue={url}
                        value={value}
                        theme={{
                            colors: {
                                onSurfaceVariant: Colors.primary
                            }
                        }}
                    />
                )}
                name="url"
            />
            {errors.url && <Text>{errors.url.message}</Text>}
            <Controller
                control={control}
                rules={{
                    required: true,
                }}
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        style={{
                            marginTop: 30,
                            width:320,
                            height:40,
                            backgroundColor: Colors.background
                        }}
                        autoCapitalize="none"
                        mode="outlined"
                        label="Username"
                        disabled={isLoading}
                        activeOutlineColor={Colors.primary}
                        outlineColor={Colors.primary}
                        textColor={Colors.primary}
                        onChangeText={onChange}
                        defaultValue={username}
                        value={value}
                        theme={{
                            colors: {
                                onSurfaceVariant: Colors.primary
                            }
                        }}
                    />
                )}
                name="username"
            />
            {errors.username && <Text>{errors.username.message}</Text>}
            <Controller
                control={control}
                rules={{
                    required: true,
                }}
                render={({ field: { onChange, value } }) => (
                    <TextInput
                        style={{
                            marginTop: 30,
                            width:320,
                            height:40,
                            backgroundColor: Colors.background
                        }}
                        autoCapitalize="none"
                        mode="outlined"
                        label="Password"

                        secureTextEntry={true}
                        disabled={isLoading}
                        activeOutlineColor={Colors.primary}
                        outlineColor={Colors.primary}
                        textColor={Colors.primary}
                        onChangeText={onChange}
                        defaultValue={password}
                        value={value}
                        theme={{
                            colors: {
                                onSurfaceVariant: Colors.primary
                            }
                        }}
                    />
                )}
                name="password"
            />
            {errors.password && <Text>{errors.password.message}</Text>}
            <Button
                style={{marginTop: 30}}
                mode="contained-tonal"
                disabled={isLoading}
                onPress={handleSubmit(onPressSend)}
                buttonColor={Colors.primary}
                textColor={Colors.background}
            >Log In</Button>
        </SafeAreaView>
    );
}
