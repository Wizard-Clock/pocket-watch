import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from "react-native";
import BackgroundGeolocation from "react-native-background-geolocation";

const STORAGE_KEY:string = "pocket-watch";

const APP_SETTINGS:any = {
    common: [
        {name: 'url', group: 'http', inputType: 'text', dataType: 'string', defaultValue: 'http://your.server.com/endpoint'},
        {name: 'desiredAccuracy', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [
                {label: 'HIGH', value: BackgroundGeolocation.DESIRED_ACCURACY_HIGH, description: "Highest power; highest accuracy."},
                {label: 'MEDIUM', value: BackgroundGeolocation.DESIRED_ACCURACY_MEDIUM, description: "Medium power; Medium accuracy;"},
                {label: 'LOW', value: BackgroundGeolocation.DESIRED_ACCURACY_LOW, description:"Lower power."},
                {label: 'MINIMUM', value: BackgroundGeolocation.DESIRED_ACCURACY_VERY_LOW, description:"Lowest power; lowest accuracy."},
            ], defaultValue: BackgroundGeolocation.DESIRED_ACCURACY_HIGH },
        {name: 'distanceFilter', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 10, 20, 50, 100, 500], defaultValue: 20},
        {name: 'useSignificantChangesOnly', group: 'geolocation', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
        // Application
        {name: 'stopOnTerminate', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
        {name: 'startOnBoot', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: true},
        {name: 'heartbeatInterval', group: 'application', dataType: 'integer', inputType: 'select', values: [-1, 60, (2*60), (5*60), (15*60)], defaultValue: 60},
        // Logging & Debug
        {name: 'debug', group: 'debug', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: true},
        {name: 'logLevel', group: 'debug', dataType: 'string', inputType: 'select', values:[
                {label: 'OFF', value: 0},
                {label: 'ERROR', value: 1},
                {label: 'WARN', value: 2},
                {label: 'INFO', value: 3},
                {label: 'DEBUG', value: 4},
                {label: 'VERBOSE', value: 5}
            ], defaultValue: 5},
        {name: 'logMaxDays', group: 'debug', dataType: 'integer', inputType: 'select', values: [1, 2, 3, 4, 5, 6, 7], defaultValue: 3}
    ],
    ios: [
        {name: 'preventSuspend', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    ],
    android: [
        // Application
        {name: 'enableHeadless', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: true},
        {name: 'notificationPriority', group: 'application', dataType: 'integer', inputType: 'select', values: [
                {label:'DEFAULT', value:BackgroundGeolocation.NOTIFICATION_PRIORITY_DEFAULT},
                {label:'HIGH', value:BackgroundGeolocation.NOTIFICATION_PRIORITY_HIGH},
                {label:'LOW', value:BackgroundGeolocation.NOTIFICATION_PRIORITY_LOW},
                {label:'MAX', value:BackgroundGeolocation.NOTIFICATION_PRIORITY_MAX},
                {label:'MIN', value:BackgroundGeolocation.NOTIFICATION_PRIORITY_MIN}
            ], defaultValue: BackgroundGeolocation.NOTIFICATION_PRIORITY_DEFAULT}
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

    private readonly platform: string;
    private appSettings: any;
    private settingConstants: any;

    constructor(props: any) {
        this.platform = Platform.OS.toLowerCase();
        this._loadApplicationSettings();

        const items = [].concat(APP_SETTINGS.common).concat(APP_SETTINGS[this.platform]);
        this.settingConstants.items = items;
        // Create a Map of Settings for speedy lookup.
        items.forEach((item:any) => {
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
    get(name:string) {
        return this.appSettings[name];
    }

    getApplicationSettings(group:any) {
        if (group !== undefined) {
            let settings = [];
            return APP_SETTINGS.filter((setting:any) => { return setting.group === group; });
        } else {
            return APP_SETTINGS;
        }
    }


    /**
     * Load the application-settings from AsyncStorage
     * @param {Function} callback
     */
    _loadApplicationSettings(callback?:Function) {
        AsyncStorage.getItem(STORAGE_KEY + ":settings", (err, value) => {
            if (value) {
                this.appSettings = JSON.parse(value);
            } else {
                this.appSettings = this._getDefaultSettings();
                this._saveSettings();
            }

            if (callback) {
                callback(this.appSettings);
            }
        });
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