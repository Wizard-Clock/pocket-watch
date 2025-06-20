import React, {useState} from 'react';
import {Appbar, Switch, Text, TextInput} from 'react-native-paper'
import {useRouter} from "expo-router";
import {useAuthSession} from "@/providers/AuthService";
import {SafeAreaView, ScrollView, View} from "react-native";
import {useLocationSession} from "@/providers/LocationService";
import SettingsService from "@/providers/SettingsService";
import { Dropdown } from 'react-native-element-dropdown';
import {ListItem} from "react-native-elements";

export default function SettingsPage() {
    const {signOut} = useAuthSession();
    const locationSession = useLocationSession();
    const settingsService = SettingsService.getInstance();

    const renderPluginSettings = (category:string) => {
        return settingsService.getApplicationSettings(category).map((setting:any, i: any) => {
            switch (setting.inputType) {
                case 'select':
                    return buildSelectField(setting, i, onFieldChange);
                    break;
                case 'toggle':
                    return buildSwitchField(setting, i, onFieldChange);
                    break;
                case 'text':
                    return buildInputField(setting, i, onFieldChange);
                    break;
            }
        });
    }

    /// Render <Input /> Field
    const buildInputField = (setting:any, i:number, onChangeCallback:Function) => {
        const [inputValue, setInputValue] = useState(settingsService.getSettingValue(setting.name));
        console.log("buildInputField");
        console.log(setting);
        console.log(settingsService.getSettingValue(setting.name));
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
                        height:40
                    }}
                    mode="outlined"
                    keyboardType="default"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus={false}
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
                        onValueChange={(value) => {
                            onChangeCallback(setting.name, value);
                            setSwitchValue(value);
                        }}
                    />
                </ListItem.Content>
            </ListItem>
        );
    }

    /// Render <DropDownPicker /> field.
    const buildSelectField = (setting:any, i:number, onChangeCallback:Function) => {
        console.log("buildSelectField");
        console.log(setting.values);
        console.log(settingsService.getSettingValue(setting.name));
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
                        onChange={(value) => onChangeCallback(setting.name, value)}
                    />
                </ListItem.Content>
            </ListItem>
        )
    };

    const onFieldChange = (name:any, value:any) => {
        console.log("onFieldChange");
        console.log(name);
        console.log(settingsService.getSettingValue(name));
        console.log(value);
        if (settingsService.getConstant(name) === value) { return; }
        settingsService.set(name, value);
        console.log("[doSetConfig] name: " + name + ", value: " + value);
        locationSession.updateLocationConfig();
    }


    return (
        <>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => useRouter().back()} />
                <Appbar.Action
                    icon={locationSession.locationIcon}
                    onPress={locationSession.toggleLocationService}
                    isLeading={true}
                />
                <Appbar.Content title="Settings"/>
                <Appbar.Action icon="logout" onPress={signOut} />
            </Appbar.Header>
            <ScrollView>
                <SafeAreaView>
                    <Text>Geolocation</Text>
                    <View>
                        {renderPluginSettings('geolocation')}
                    </View>
                    <Text>HTTP &amp; Persistence</Text>
                    <View>
                        {renderPluginSettings('http')}
                    </View>
                    <Text>Application</Text>
                    <View>
                        {renderPluginSettings('application')}
                    </View>
                </SafeAreaView>
            </ScrollView>
        </>
    );
}
