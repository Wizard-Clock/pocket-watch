import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from "react-native";
import * as Location from 'expo-location'

const STORAGE_KEY:string = "pocket-watch";

const APP_SETTINGS:any = {
    common: [
        {name: 'url', group: 'http', inputType: 'text', dataType: 'string', defaultValue: 'https://'},
        {name: 'username', group: 'hidden', inputType: 'text', dataType: 'string', defaultValue: ''},
        {name: 'desiredAccuracy', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [
                {label: 'HIGHEST', value: Location.Accuracy.Highest},
                {label: 'HIGH', value: Location.Accuracy.High},
                {label: 'BALANCED', value: Location.Accuracy.Balanced},
                {label: 'LOW', value: Location.Accuracy.Low},
                {label: 'LOWEST', value: Location.Accuracy.Lowest},
            ], defaultValue: Location.Accuracy.High },
        {name: 'distanceInterval', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [
                {label: '0 m', value: 0},
                {label: '10 m', value: 10},
                {label: '20 m', value: 20},
                {label: '50 m', value: 50},
                {label: '100 m', value: 100},
                {label: '500 m', value: 500},
            ], defaultValue: 0},
        {name: 'useSignificantChangesOnly', group: 'geolocation', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
        // Application
        {name: 'heartbeatInterval', group: 'application', dataType: 'integer', inputType: 'select', values: [
                {label: '1 minute', value: 60},
                {label: '2 minutes', value: 120},
                {label: '5 minutes', value: 300},
                {label: '15 minutes', value: 900},
            ], defaultValue: 60},
    ],
    ios: [
        {name: 'preventSuspend', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    ],
    android: [
        // Application
        {name: 'timeInterval', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [
                {label: '0 second', value: 0},
                {label: '5 seconds', value: 5000},
                {label: '30 seconds', value: 30000},
                {label: '1 minute', value: 60000},
                {label: '5 minutes', value: 300000},
                {label: '15 minutes', value: 900000},
                {label: '30 minutes', value: 1800000},
            ], defaultValue: 5000}
    ]
};

let instance:any = null;

export default class SettingsService {
    static getInstance() {
        if (instance === null) {
            instance = new SettingsService({});
        }
        return instance;
    }

    private platform: string;
    private appSettings: any = null;
    private settingConstants: any;

    constructor(props: any) {
        this.platform = Platform.OS.toLowerCase();
        this._loadApplicationSettings().then(r => console.log("_loadApplicationSettings doner"));

        this.settingConstants = {
            items: [],
            map: {}
        };

        const items = [].concat(APP_SETTINGS.common).concat(APP_SETTINGS[this.platform]);
        this.settingConstants.items = items;
        // Create a Map of Settings for speedy lookup.
        items.forEach((item: any) => {
            this.settingConstants.map[item.name] = item;
        });
    }

    /**
     * Sets and persists a single Application setting
     * @param {String} name
     * @param {Mixed} value
     */
    set(name:string, value:any) {
        if (this.appSettings[name] === value) {
            // No change.  Ignore
            return;
        }
        this.appSettings[name] = value;
        this._saveSettings();
    }

    /**
     * Gets a single Application setting
     * @param {String} name
     */
    getSettingValue(name:string) {
        return this.appSettings[name];
    }

    /**
     * Gets a single Application setting
     * @param {String} name
     */
    getConstant(name:string) {
        return this.settingConstants[name];
    }

    getApplicationSettings(group:any) {
        if (group !== undefined) {
            let settings = [];
            let items = [].concat(APP_SETTINGS.common).concat(APP_SETTINGS[this.platform]);
            return items.filter((setting:any) => { return setting.group === group; });
        } else {
            return APP_SETTINGS;
        }
    }


    /**
     * Load the application-settings from AsyncStorage
     * @param {Function} callback
     */
    async _loadApplicationSettings(callback?:Function) {
        await AsyncStorage.getItem(STORAGE_KEY + ":settings").then((value) => {
            if (value) {
                this.appSettings = JSON.parse(value);
            } else {
                this.appSettings = this._getDefaultSettings();
                this._saveSettings();
            }

            if (callback) {
                callback(this.appSettings);
            }
        })
    }

    /**
     * Returns the default application-settings {}
     * @return {Object}
     */
    _getDefaultSettings(): object {
        let state:any = {};
        const items = [].concat(APP_SETTINGS.common).concat(APP_SETTINGS[this.platform]);
        items.forEach((setting:any) => {
            state[setting.name] = setting.defaultValue;
        });
        return state;
    }

    /**
     * Persist the application settings to AsyncStorage
     */
    _saveSettings() {
        AsyncStorage.setItem(STORAGE_KEY + ":settings", JSON.stringify(this.appSettings, null));
    }
}