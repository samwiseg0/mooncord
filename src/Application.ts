import * as packageConfig from '../package.json'
import * as util from 'util'
import {DiscordClient} from './clients/DiscordClient'
import {MoonrakerClient} from './clients/MoonrakerClient'
import {hookProcess, logEmpty, logError, logRegular, logSuccess, tempHookLog} from './helper/LoggerHelper'
import {DatabaseUtil} from './utils/DatabaseUtil'
import {LocaleHelper} from "./helper/LocaleHelper";
import { setData } from './utils/CacheUtil'
import {ConfigHelper} from "./helper/ConfigHelper";
import {EmbedHelper} from "./helper/EmbedHelper";
import {SchedulerHelper} from "./helper/SchedulerHelper";
import {StatusHelper} from "./helper/StatusHelper";
import {waitUntil} from "async-wait-until";

Object.assign(global, { WebSocket: require('ws') })

tempHookLog()
hookProcess()

logSuccess(`Starting ${packageConfig.name} ${packageConfig.version}...`)

const configHelper = new ConfigHelper()
configHelper.loadCache()

const localeHelper = new LocaleHelper()
const embedHelper = new EmbedHelper()

const moonrakerClient = new MoonrakerClient()
const database = new DatabaseUtil()
const discordClient = new DiscordClient()

const schedulerHelper = new SchedulerHelper()
const statusHelper = new StatusHelper()

void init()

async function init() {
    initCache()

    logEmpty()

    let currentInitState = 'Moonraker Client'

    try {
        await moonrakerClient.connect()
        await waitUntil(() => moonrakerClient.isReady(), { timeout: 10_000, intervalBetweenAttempts: 500 })

        currentInitState = 'Database'
        await database.retrieveDatabase()
        await waitUntil(() => database.isReady(), { timeout: 10_000, intervalBetweenAttempts: 500 })
        
        currentInitState = 'Discord Client'
        await discordClient.connect()
        await waitUntil(() => discordClient.isConnected(), { timeout: 10_000, intervalBetweenAttempts: 500 })
    } catch (error) {
        logError(`couldn't load ${currentInitState} in Time! Reason: ${util.format(error)}`)
    }

    logRegular('Register Scheduler...')

    schedulerHelper.init(moonrakerClient)

    await statusHelper.update(null, true, discordClient)
}

export function reloadCache() {
    logEmpty()
    logSuccess('reload Cache...')

    initCache()
}

export async function reconnectDiscord() {
    logEmpty()
    logSuccess('reconnect Discord...')
    await discordClient.connect()
}

export async function restartScheduler() {
    logEmpty()
    logSuccess('restart Scheduler...')
    schedulerHelper.clear()
    schedulerHelper.init(moonrakerClient)
}

export async function reconnectMoonraker() {
    logEmpty()
    logSuccess('reconnect Moonraker...')
    schedulerHelper.clear()
    moonrakerClient.close()

    await moonrakerClient.connect()
}

function initCache() {
    logRegular('load Package Cache...')
    setData('package_config', packageConfig)

    logRegular('init Function Cache...')
    setData('function', {
        'current_status': 'botstart',
        'status_in_query': false,
        'server_info_in_query': false,
        'poll_printer_info': false,
        'current_percent': -1,
        'status_cooldown': 0,
        'log_path': ''
    })

    logRegular('init Memory Cache...')
    setData('usage', {
        'total_ram': '',
        'used_ram': '',
        'free_ram': '',
        'total_disk': '',
        'used_disk': '',
        'free_disk': '',
        'klipper_load': 0,
        'system_load': 0
    })

    logRegular('init Time Cache...')
    setData('time', {
        'total': 0,
        'duration': 0,
        'left': 0,
        'eta': 0
    })

    logRegular('init Layer Cache...')
    setData('layers', {
        'top': 0,
        'current': 0
    })

    logRegular('init Throttle Cache...')
    setData('throttle', {
        'cooldown': 0,
        'throttle_states': []
    })

    logRegular('init MetaData Cache...')
    setData('meta_data', {
        'filename': ''
    })

    configHelper.loadCache()
    localeHelper.loadCache()
    embedHelper.loadCache()
}

export function getMoonrakerClient() {
    return moonrakerClient
}

export function getDiscordClient() {
    return discordClient
}

export function getDatabase() {
    return database
}