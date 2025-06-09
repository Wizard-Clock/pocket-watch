import {useAuthSession} from "../../providers/Auth";
import {TextInput, Button, Text} from 'react-native-paper';
import * as yup from 'yup';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {Image, SafeAreaView} from "react-native";

export default function Login() {
    let url;
    let username;
    let password;
    const loginSchema = yup.object().shape({
        url: yup
            .string()
            .url()
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
    const {signIn} = useAuthSession();
    const onPressSend = (formData) => {
        console.log(formData);
        // signIn(url, {username, password});
    };

    return (
        <SafeAreaView
            style={{
                flex: 1,
                justifyContent: "flex-start",
                alignItems: "center",
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
                            height:40
                        }}
                        autoCapitalize="none"
                        mode="outlined"
                        label="Server URL"
                        onChangeText={onChange}
                        defaultValue={url}
                        value={value}
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
                            height:40
                        }}
                        autoCapitalize="none"
                        mode="outlined"
                        label="Username"
                        onChangeText={onChange}
                        defaultValue={username}
                        value={value}
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
                            height:40
                        }}
                        autoCapitalize="none"
                        mode="outlined"
                        label="Password"
                        secureTextEntry={true}
                        onChangeText={onChange}
                        defaultValue={password}
                        value={value}
                    />
                )}
                name="password"
            />
            {errors.password && <Text>{errors.password.message}</Text>}
            <Button
                style={{marginTop: 30}}
                mode="contained-tonal"
                onPress={handleSubmit(onPressSend)}
            >Log In</Button>
        </SafeAreaView>
    );
}
