import React from 'react';
import { Appbar, Button, TextInput, Switch, Text } from 'react-native-paper'
import { ListItem } from 'react-native-elements'
import DropDownPicker from 'react-native-dropdown-picker';
import {useRouter} from "expo-router";
import {useAuthSession} from "@/providers/Auth";
import SettingsService from '@/providers/Settings';
import BackgroundGeolocation, {
    State
} from "@/components/geoloc";
import {StyleSheet, ScrollView, View, SafeAreaView} from 'react-native';

export const COLORS = {
    gold: 'rgba(254,221,30,1)',//#fedd1e',
    light_gold: '#FFEB73',
    dark_gold: '#D5B601',
    white: '#fff',
    black: '#000',
    light_blue: '#2677FF',
    blue: '#337AB7',
    grey: '#404040',
    red: '#FE381E',
    green: '#16BE42',
    dark: '#272727',
    polyline_color: 'rgba(0,179,253, 0.6)'//'#00B3FD'
};

/// Local cache of plugin State.
let locationState:State = {
    enabled: false,
    isMoving: false,
    schedulerEnabled: false,
    trackingMode: 1,
    odometer: 0,
    didDeviceReboot: false,
    didLaunchInBackground: false
};

/// Field-change buffer
/// We buffer calls to BackgroundGeolocation.setConfig when editing TEXT fields so that we don't
/// call setConfig for each key-press.
let fieldChangeBuffer:any = 0;

export default function Settings() {
    DropDownPicker.setListMode("MODAL");
    const {signOut} = useAuthSession();
    const settingsService = SettingsService.getInstance();

    const [isDestroyingLog, setIsDestroyingLog] = React.useState(false);
    const [state, setState] = React.useState(() => {  // <-- callback form for initalState
        // Build default state.
        const settings = settingsService.getLocationSettings();

        let defaultState:any = {};

        const initSettingState = (setting:any) => {
            const record:any = {value: setting.defaultValue};

            if (setting.inputType === 'select') {
                record.open = false;
                record.items = setting.values.map((value:any) => {
                    return (typeof(value) === 'object') ? value : {label: value.toString(), value: value};
                })
            }
            defaultState[setting.name] = record;
        }

        // First collect all the BGGeo settings and initialize default state object without values.
        settings.forEach(initSettingState);
        // Now initialize demo app settings state.
        settingsService.getApplicationSettings().forEach(initSettingState);

        BackgroundGeolocation.getState().then((state:any) => {
            locationState = state;

            settings.forEach((setting:any) => {
                switch (setting.name) {
                    case 'notificationPriority':
                        defaultState[setting.name].value = state.notification.priority;
                        break;
                    case 'desiredAccuracy':
                        defaultState[setting.name].value = (state.desiredAccuracy === 0) ? BackgroundGeolocation.DESIRED_ACCURACY_HIGH : state.desiredAccuracy;
                        break;
                    default:
                        defaultState[setting.name].value = state[setting.name];
                }
            });

            // Now update the React State with current plugin State.
            setState((prevState:any) => ({...prevState, defaultState}));
        });

        return defaultState;
    });

    /// field-change handler for every setting.  Calls BackgroundGeolocation.setConfig.
    const onFieldChange = (setting:any, value:any) => {
        if (state[setting.name].value === value) { return; }

        // Update state.
        setState((prevState:any) => ({
            ...prevState,
            [setting.name]: {
                ...prevState[setting.name],
                value: value
            }
        }));

        const config:any = {};

        switch(setting.name) {
            case 'notificationPriority':
                let notification:any = locationState['notification'];
                notification.priority = value;
                config['notification'] = notification;
                break;
            default:
                config[setting.name] = value;
        }

        if (setting.name === 'trackingMode') {
            // Special case for trackingMode which is toggled via .start() / .startGeofences()
            // Does not use setConfig.
            console.log(`[onFieldChange] trackingMode: (${typeof(value)})`);
            if (value === 1) {
                BackgroundGeolocation.start();
            } else {
                BackgroundGeolocation.startGeofences();
            }
        } else {
            if (setting.inputType === 'text') {
                // Special case for text fields:  Buffer field-changes by 1000ms
                if (fieldChangeBuffer > 0) {
                    clearTimeout(fieldChangeBuffer);
                    fieldChangeBuffer = 0;
                }
                fieldChangeBuffer = setTimeout(() => doSetConfig(config), 1000);
            } else {
                // typical case:  setConfig immediately.
                doSetConfig(config);
            }
        }
    }

    const doSetConfig = (config:any) => {
        console.log(`[doSetConfig] ${JSON.stringify(config)}`);
        BackgroundGeolocation.setConfig(config).then((state:State) => {
            locationState = state;
        });
    }

    /// Render a category of settings fields.
    /// - geolocation
    /// - activity recognition
    /// - http & persistence
    /// - application
    /// - debug
    ///
    const renderLocationSettings = (category:string) => {
        return settingsService.getLocationSettings(category).map((setting:any, i: number) => {
            return buildField(setting, i, onFieldChange);
        });
    }

    const buildField = (setting:any, i:number, callback:Function) => {
        switch (setting.inputType) {
            case 'select':
                return buildSelectField(setting, i, callback);
                break;
            case 'toggle':
                return buildSwitchField(setting, i, callback);
                break;
            case 'text':
                return buildInputField(setting, i, callback);
                break;
        }
    }
    /// Render <Input /> Field
    const buildInputField = (setting:any, i:number, onChangeCallback:Function) => {
        return (
            <ListItem key={setting.name} bottomDivider>
                <TextInput
                    label={setting.name}
                    value={state[setting.name].value}
                    onChangeText={(value) => onChangeCallback(setting, value)}
                    keyboardType="default"
                    autoCapitalize="none"
                    autoComplete="username"
                    autoCorrect={false}
                    autoFocus={false}
                />
            </ListItem>
        );
    }

    /// Render <Switch /> Field
    const buildSwitchField = (setting:any, i:number, onChangeCallback:Function) => {
        return (
            <ListItem key={setting.name} bottomDivider>
                <ListItem.Content style={{flexDirection: 'row', alignItems: 'center', paddingTop: 5, paddingBottom:5}}>
                    <ListItem.Title>{setting.name}</ListItem.Title>
                    <Switch onValueChange={(value) => onChangeCallback(setting, value)} value={state[setting.name].value} />
                </ListItem.Content>
            </ListItem>
        );
    }

    const buildSelectField = (setting:any, i:number, onChangeCallback:Function) => {

        const setOpen = (value:any) => {
            setState((prevState:any) => ({
                ...prevState,
                [setting.name]: {
                    ...prevState[setting.name],
                    open: value
                }
            }));
        }

        const setValue = (callback:Function) => {
            onChangeCallback(setting, callback(state[setting.name].value));
        }

        const setItems = (callback:any) => {
            setState((prevState:any) => ({
                ...prevState,
                [setting.name]: {
                    ...prevState[setting.name],
                    items: callback(prevState.items)
                }
            }))
        }

        return (
            <ListItem key={setting.name} bottomDivider>
                <ListItem.Content>
                    <ListItem.Title>{setting.name}</ListItem.Title>
                        <DropDownPicker
                            open={state[setting.name].open}
                            value={state[setting.name].value}
                            items={state[setting.name].items}
                            setOpen={(value) => setOpen(value)}
                            setValue={(value) => setValue(value)}
                            setItems={(items) => setItems(items)}
                            listItemLabelStyle={{
                                fontSize: 18
                            }}
                            style={{
                                borderColor: '#ccc'
                            }}
                        />
                </ListItem.Content>
            </ListItem>
        )
    };

    const onClickDestroyLog = () => {
        setIsDestroyingLog(true);
        BackgroundGeolocation.logger.destroyLog().then(() => {
            setIsDestroyingLog(false);
        }).catch((error) => {
            setIsDestroyingLog(false);
            settingsService.alert("Destroy Log Error", error);
        })
    }

    return (
        <>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => useRouter().back()} />
                <Appbar.Content title="Settings"/>
                <Appbar.Action icon="logout" onPress={signOut} />
            </Appbar.Header>
            <SafeAreaView>
                <ScrollView style={styles.container}>
                    <Text style={styles.title}>Geolocation</Text>
                    <View style={styles.section}>
                        {renderLocationSettings('geolocation')}
                    </View>

                    <Text style={styles.title}>Activity Recognition</Text>
                    <View style={styles.section}>
                        {renderLocationSettings('activity recognition')}
                    </View>

                    <Text style={styles.title}>HTTP &amp; Persistence</Text>
                    <View style={styles.section}>
                        {renderLocationSettings('http')}
                    </View>

                    <Text style={styles.title}>Application</Text>
                    <View style={styles.section}>
                        {renderLocationSettings('application')}
                    </View>

                    <Text style={styles.title}>Debug</Text>
                    <View style={styles.section}>
                        {renderLocationSettings('debug')}

                        <ListItem containerStyle={{flexDirection: 'column', alignItems: 'stretch'}} bottomDivider>
                            <Button
                                loading={isDestroyingLog}
                                onPress={onClickDestroyLog}>
                                Destroy logs
                            </Button>
                        </ListItem>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {

    },
    buttonTitleStyle: {
        fontSize: 14
    },
    header: {
        backgroundColor: '#fedd1e'
    },
    title: {
        color: '#000',
        marginTop: 10,
        marginBottom: 10,
        fontSize: 18,
        textAlign:'center',
        fontWeight: 'bold'
    },
    section: {
        paddingBottom: 10,
        paddingTop: 5,
        marginBottom: 10,
        backgroundColor: '#fff'
    },
    listItem: {
        padding: 0,
        margin: 0
    },
    inlineField: {
        marginTop: 5,
        marginBottom: 5,
    },
    input: {
        padding: 0,
        fontSize: 14,
        margin: 0,
        minHeight: 20
    },
    inputContainer: {
        margin: 0,
        padding: 0,

    },
    listItemContainer: {
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom:10,
        paddingTop:10,
    },
    formLabel: {
        color: COLORS.light_blue,
        flex: 1,
        paddingLeft: 3,
        paddingBottom: 3
    }
});