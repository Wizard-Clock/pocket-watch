import React, {useState} from 'react';
import {Appbar, Banner, Button, Portal, Snackbar, Switch, Text, TextInput} from 'react-native-paper'
import {useRouter} from "expo-router";
import {useAuthSession} from "@/providers/AuthService";
import {SafeAreaView, ScrollView, View, Linking} from "react-native";
import {useLocationSession} from "@/providers/LocationService";
import SettingsService from "@/providers/SettingsService";
import { Dropdown } from 'react-native-element-dropdown';
import {ListItem} from "react-native-elements";
import Colors from "@/components/colorPalette";

export default function SettingsPage() {
    const {signOut} = useAuthSession();
    const locationSession = useLocationSession();
    const settingsService = SettingsService.getInstance();
    const onLayout= () => {locationSession.resyncLocationServices()}

    const renderPluginSettings = (category:string) => {
        return settingsService.getApplicationSettings(category).map((setting:any, i: any) => {
            switch (setting.inputType) {
                case 'select':
                    return buildSelectField(setting, i, onFieldChange);
                case 'toggle':
                    return buildSwitchField(setting, i, onFieldChange);
                case 'text':
                    return buildInputField(setting, i, onFieldChange);
            }
        });
    }

    /// Render <Input /> Field
    const buildInputField = (setting:any, i:number, onChangeCallback:Function) => {
        const [inputValue, setInputValue] = useState(settingsService.getSettingValue(setting.name));
        return (
            <ListItem key={setting.name} bottomDivider>
                <TextInput
                    label={setting.name}
                    value={inputValue}
                    onChangeText={(value) => {
                        onChangeCallback(setting.name, value);
                        setInputValue(value);
                    }}
                    style={{
                        width:320,
                        height:40,
                        backgroundColor: Colors.background,
                        color: Colors.primary
                    }}
                    mode="outlined"
                    keyboardType="default"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus={false}
                    disabled={locationSession.locationStarted}
                    activeOutlineColor={Colors.primary}
                    outlineColor={Colors.primary}
                    textColor={Colors.primary}
                    theme={{
                        colors: {
                            onSurfaceVariant: Colors.primary
                        }
                    }}
                />
            </ListItem>
        );
    }

    /// Render <Switch /> Field
    const buildSwitchField = (setting:any, i:number, onChangeCallback:Function) => {
        const [switchValue, setSwitchValue] = useState(settingsService.getSettingValue(setting.name));
        return (
            <ListItem key={setting.name} bottomDivider>
                <ListItem.Content style={{flexDirection: 'row', alignItems: 'center', paddingTop: 5, paddingBottom:5}}>
                    <ListItem.Title>{setting.name}</ListItem.Title>
                    <Switch
                        value={switchValue}
                        color={Colors.primary}
                        onValueChange={(value) => {
                            onChangeCallback(setting.name, value);
                            setSwitchValue(value);
                        }}
                        disabled={locationSession.locationStarted}
                    />
                </ListItem.Content>
            </ListItem>
        );
    }

    /// Render <DropDownPicker /> field.
    const buildSelectField = (setting:any, i:number, onChangeCallback:Function) => {
        return (
            <ListItem key={setting.name} bottomDivider>
                <ListItem.Content>
                    <ListItem.Title>{setting.name}</ListItem.Title>
                    <Dropdown
                        style={{
                            width:320,
                            height:40
                        }}
                        data={setting.values}
                        labelField="label"
                        valueField="value"
                        value={settingsService.getSettingValue(setting.name)}
                        onChange={(value) => onChangeCallback(setting.name, value.value)}
                        disable={locationSession.locationStarted}
                    />
                </ListItem.Content>
            </ListItem>
        )
    };

    const onFieldChange = (name:any, value:any) => {
        if (settingsService.getConstant(name) === value) { return; }
        settingsService.set(name, value);
        console.log("[doSetConfig] name: " + name + ", value: " + value);
        locationSession.updateLocationConfig();
    }


    return (
        <>
            <Appbar.Header
                style={{
                    backgroundColor: Colors.primary
                }}
                theme={{ colors: { primary: 'green' } }}
            >
                <Appbar.BackAction
                    onPress={() => useRouter().back()}
                    color={Colors.background}
                />
                <Appbar.Action
                    icon={locationSession.locationIcon}
                    onPress={locationSession.toggleLocationService}
                    isLeading={true}
                    color={Colors.background}
                />
                <Appbar.Content title="Settings" color={Colors.background}/>
                <Appbar.Action
                    icon="logout"
                    onPress={signOut}
                    color={Colors.background} />
            </Appbar.Header>
            <ScrollView
                style={{
                    backgroundColor: Colors.background,
                    width: "100%"
                }}
            >
                <SafeAreaView
                    onLayout={onLayout}
                >
                    <Banner
                        visible={locationSession.locationStarted}
                        actions={[{
                            label: 'Turn off Location',
                            onPress: () => {
                                locationSession.toggleLocationService();
                            },
                        }]}
                        style={{
                            backgroundColor: Colors.secondary,
                        }}
                        theme={{
                            colors: { primary: Colors.primary
                            }}}
                    >
                        <Text
                            style={{
                                color: Colors.background,
                            }}
                        >
                            Location reporting must be off to update settings.
                        </Text>
                    </Banner>
                    <Text>Geolocation</Text>
                    <View>
                        {renderPluginSettings('geolocation')}
                    </View>
                    {/*<Text>HTTP &amp; Persistence</Text>*/}
                    {/*<View>*/}
                    {/*    {renderPluginSettings('http')}*/}
                    {/*</View>*/}
                    <Text>Dev Section</Text>
                    <View>
                        <ListItem key="webClient" bottomDivider>
                            <ListItem.Content>
                                <ListItem.Title>Server Web Client</ListItem.Title>
                                <Button
                                    mode="contained-tonal"
                                    onPress={() => Linking.openURL(settingsService.getSettingValue("url"))}
                                    buttonColor={Colors.primary}
                                    textColor={Colors.background}
                                >Server Web Client</Button>
                            </ListItem.Content>
                        </ListItem>
                        <ListItem key="plzdontkill" bottomDivider>
                            <ListItem.Content>
                                <ListItem.Title>Android Background Usage</ListItem.Title>
                                <Button
                                    mode="contained-tonal"
                                    onPress={() => Linking.openURL("https://dontkillmyapp.com/")}
                                    buttonColor={Colors.primary}
                                    textColor={Colors.background}
                                >Android Optimization Info</Button>
                            </ListItem.Content>
                        </ListItem>
                        <ListItem key="locationPing" bottomDivider>
                            <ListItem.Content>
                                <ListItem.Title>Send Location Ping to Server</ListItem.Title>
                                    <Button
                                        style={{marginBottom: 30}}
                                        mode="contained-tonal"
                                        onPress={locationSession.sendLocationPing}
                                        buttonColor={Colors.primary}
                                        textColor={Colors.background}
                                    >Location Ping</Button>
                            </ListItem.Content>
                        </ListItem>
                    </View>
                    <Portal>
                        <Snackbar
                            visible={locationSession.portalSnackbarVisible}
                            onDismiss={() => locationSession.setPortalSnackbarVisible(false)}
                            action={{
                                textColor: Colors.secondary,
                                label: 'Dismiss'
                            }}
                        >
                            {locationSession.portalSnackbarText}
                        </Snackbar>
                    </Portal>
                </SafeAreaView>
            </ScrollView>
        </>
    );
}
