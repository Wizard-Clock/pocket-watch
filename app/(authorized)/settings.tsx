import React from 'react';
import {Appbar, Switch, Text, TextInput} from 'react-native-paper'
import {useRouter} from "expo-router";
import {useAuthSession} from "@/providers/AuthService";
import {SafeAreaView, ScrollView, View} from "react-native";
import {useLocationSession} from "@/providers/LocationService";
import SettingsService from "@/providers/SettingsService";
import { Dropdown } from 'react-native-element-dropdown';
import {ListItem} from "react-native-elements";

export default async function SettingsPage() {
    const {signOut} = useAuthSession();
    const locationSession = useLocationSession();
    const settingsService = await SettingsService.getInstance();

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
        console.log("buildInputField");
        console.log(setting);
        console.log(settingsService.get(setting.name));
        return (
            <ListItem key={setting.name} bottomDivider>
                <TextInput
                    label={setting.name}
                    value={settingsService.get(setting.name).value}
                    onChangeText={(value) => onChangeCallback(setting.name, value)}
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
        console.log("buildSwitchField");
        console.log(setting.name);
        console.log(settingsService.get(setting.name));
        return (
            <ListItem key={setting.name} bottomDivider>
                <ListItem.Content style={{flexDirection: 'row', alignItems: 'center', paddingTop: 5, paddingBottom:5}}>
                    <ListItem.Title>{setting.name}</ListItem.Title>
                    <Switch onValueChange={(value) => onChangeCallback(setting.name, value)} value={settingsService.get(setting.name).value} />
                </ListItem.Content>
            </ListItem>
        );
    }

    /// Render <DropDownPicker /> field.
    const buildSelectField = (setting:any, i:number, onChangeCallback:Function) => {
        console.log("buildSelectField");
        console.log(setting.name);
        console.log(i);
        console.log(settingsService.get(setting.name));
        return (
            <ListItem key={setting.name} bottomDivider>
                <ListItem.Content>
                    <ListItem.Title>{setting.name}</ListItem.Title>
                    <Dropdown
                        data={setting.values}
                        search
                        labelField="label"
                        valueField="value"
                        value={settingsService.get(setting.name).value}
                        onChange={(value) => onChangeCallback(setting.name, value)}
                    />
                </ListItem.Content>
            </ListItem>
        )
    };

    const onFieldChange = (name:any, value:any) => {
        if (settingsService.getConstant(name).value === value) { return; }
        settingsService.set(name, value);
        console.log(`[doSetConfig] ${JSON.stringify(name, value)}`);
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
            <SafeAreaView>
                <ScrollView>
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
                </ScrollView>
            </SafeAreaView>
        </>
    );
}
