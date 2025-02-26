import { getEntry } from "../utils/CacheUtil";
import {formatPercent} from "./DataHelper";
import {ConfigHelper} from "./ConfigHelper";

export class TempHelper {
    protected cache = getEntry('state')
    protected configHelper = new ConfigHelper()
    protected tempMeta = this.configHelper.getTempMeta()

    public parseFields() {
        const result = {
            "fields": [],
            "cache_ids": []
        }
        const supportedSensors = this.tempMeta.supported_sensors

        for(const sensorType of supportedSensors) {
            const sensorResult = this.parseFieldsSet(sensorType)
            
            if(sensorResult.fields.length > 0) {
                result.fields = result.fields.concat(sensorResult.fields)
                result.cache_ids = result.cache_ids.concat(sensorResult.cache_ids)
            }
        }

        return result
    }

    protected parseFieldTitle(key: string) {
        const hideList = this.tempMeta.hide_types

        hideList.some(hideType => key = key.replace(hideType, ''))

        return key
    }

    public isCold(temperature: number) {
        return temperature < this.tempMeta.cold_meta.hot_temp
    }

    public isSlowFan(speed: number) {
        return speed < (this.tempMeta.slow_fan_meta.fast_fan / 100)
    }

    public parseFieldsSet(key: string) {
        const allias = this.tempMeta.alliases[key]

        const cacheData = this.parseCacheFields(key)

        if(typeof allias !== 'undefined') { key = allias }

        const mappingData = this.tempMeta[key]
        const fields = []
        const cacheIds = []

        for(const cacheKey in cacheData) {
            const keyData = {
                name: `${mappingData.icon} ${this.parseFieldTitle(cacheKey)}`,
                value: '',
                inline: true
            }
            if(typeof cacheData[cacheKey].temperature !== 'undefined' &&
                this.tempMeta.heater_types.includes(key)) {
                if(this.isCold(cacheData[cacheKey].temperature)) {
                    keyData.name = `${this.tempMeta.cold_meta.icon} ${this.parseFieldTitle(cacheKey)}`
                }
            }
            if(typeof cacheData[cacheKey].speed !== 'undefined' &&
                this.tempMeta.fan_types.includes(key)) {
                if(this.isSlowFan(cacheData[cacheKey].speed)) {
                    keyData.name = `${this.tempMeta.slow_fan_meta.icon} ${this.parseFieldTitle(cacheKey)}`
                }
            }
            for(const fieldKey in mappingData.fields) {
                const fieldData = mappingData.fields[fieldKey]
                if(typeof cacheData[cacheKey][fieldKey] === 'undefined') {
                    continue
                }
                if(cacheData[cacheKey][fieldKey] === null) {
                    continue
                }
                if(fieldData.suffix === '%') {
                    keyData.value = `${keyData.value}
                       \`${fieldData.label}:\`${formatPercent(cacheData[cacheKey][fieldKey], 0)}${fieldData.suffix}`
                    continue
                }
                keyData.value = `${keyData.value}
                    \`${fieldData.label}:\`${cacheData[cacheKey][fieldKey]}${fieldData.suffix}`
                
            }
            fields.push(keyData)
            cacheIds.push(cacheData[cacheKey])
        }

        return {fields: fields, cache_ids: cacheIds}
    }

    protected parseCacheFields(key) {
        const result = {}

        for(const cacheKey in this.cache) {
            const cacheKeySplit = cacheKey.split(' ')

            if(cacheKeySplit[0] === key) {
                result[cacheKey] = this.cache[cacheKey]
            }
        }

        return result
    }
}