interface Memory {
    // 所有 creep 的配置项，每次 creep 死亡或者新增时都会通过这个表来完成初始化
    creepConfigs: {
        [creepName: string]: {
            // creep 的角色名
            role: CreepRoleConstant,
            // creep 的具体配置项，每个角色的配置都不相同
            data: CreepData,
            // 执行 creep 孵化的房间名
            spawnRoom: string,
            // creep 孵化时使用的身体部件
            // 为 string 时则自动规划身体部件，为 BodyPartConstant[] 时则强制生成该身体配置
            bodys: BodyAutoConfigConstant | BodyPartConstant[]
        }
    }
    sourceConfigs:{
        [sourceId:string]:{
            // 绑定ContainerId
            containerId:string,
            room:string,
            /**
             * 资源采集位
             */
            seat:number,
        }
    }
    constructionList:{
        [roomName:string]:{
            [siteId:string]:{
                index:number
            }
        }
    }
}
interface CreepMemory {
    /**
     * 该 creep 的角色
     */
    role?: string
    /**
     * 该Creep是否在执行升级操作
     */
    upgrading?:boolean
    /**
     * 该Creep是否在执行建造操作
     */
    building?:boolean

    
    // creep 是否已经准备好可以工作了
    ready?: boolean
    // 是否在工作
    working?: boolean
    // creep 在工作时需要的自定义配置，在孵化时由 spawn 复制
    data?: CreepData
    // 该 Creep 是否在站着不动进行工作
    // 该字段用于减少 creep 向 Room.restrictedPos 里添加自己位置的次数
    standed?: boolean
    // 要采集的资源 Id
    sourceId?: string
    // 要存放到的目标建筑
    targetId?: string
}

// 所有的 creep 角色
type CreepRoleConstant = BaseRoleConstant 

// 房间基础运营
type BaseRoleConstant = 
    'harvester' |
    'collector' |
    'miner' |
    'upgrader' |
    'filler' |
    'builder' |
    'repairer'

// 房间高级运营
type AdvancedRoleConstant = 
    'manager' |
    'processor'

// 远程单位
type RemoteRoleConstant = 
    'claimer' |
    'reserver' |
    'signer' |
    'remoteBuilder' |
    'remoteUpgrader' |
    'remoteHarvester' |
    'depositHarvester' |
    'pbAttacker' |
    'pbHealer' |
    'pbCarrier' |
    'moveTester' |
    'reiver'

// 战斗单位
type WarRoleConstant =
    'soldier' |
    'doctor' |
    'boostDoctor' |
    'dismantler' |
    'boostDismantler' |
    'apocalypse' |
    'defender'


/**
 * creep 工作逻辑集合
 * 包含了每个角色应该做的工作
 */
 type CreepWork = {
    [role in CreepRoleConstant]: (data: CreepData) => ICreepConfig
}

interface ICreepConfig {
    // 每次死后都会进行判断，只有返回 true 时才会重新发布孵化任务
    isNeed?: (room: Room, creepName: string, preMemory: CreepMemory) => boolean
    // 准备阶段执行的方法, 返回 true 时代表准备完成
    prepare?: (creep: Creep) => boolean
    // creep 获取工作所需资源时执行的方法
    // 返回 true 则执行 target 阶段，返回其他将继续执行该方法
    source?: (creep: Creep) => boolean
    // creep 工作时执行的方法,
    // 返回 true 则执行 source 阶段，返回其他将继续执行该方法
    target: (creep: Creep) => boolean
    // 每个角色默认的身体组成部分
    bodys: BodyAutoConfigConstant | BodyPartConstant[]
}

/**
 * 所有 creep 角色的 data
 */
type CreepData = EmptyData|HarvesterData | WorkerData;

/**
* 有些角色不需要 data
*/
interface EmptyData { }

/**
* 采集单位的 data
* 执行从 sourceId 处采集东西，并转移至 targetId 处（不一定使用，每个角色都有自己固定的目标例如 storage 或者 terminal）
*/
interface HarvesterData {
    // 要采集的 source id
    sourceId: string
    // 把采集到的资源存到哪里存在哪里
    targetId: string
    /**
     * Container建筑Id
     */
    constructionSiteId:string
}

/**
* 工作单位的 data
* 由于由确定的工作目标所以不需要 targetId
*/
interface WorkerData {
    // 要使用的资源存放建筑 id
    sourceId: string
    // 工作目标
    targetId: string
}

/**
 * bodySet
 * 简写版本的 bodyPart[]
 * 形式如下
 * @example { [TOUGH]: 3, [WORK]: 4, [MOVE]: 7 }
 */
interface BodySet {
    [MOVE]?: number
    [CARRY]?: number
    [ATTACK]?: number
    [RANGED_ATTACK]?: number
    [WORK]?: number
    [CLAIM]?: number
    [TOUGH]?: number
    [HEAL]?: number
}

// 本项目中出现的颜色常量
type Colors = 'green' | 'blue' | 'yellow' | 'red'


/**
 * creep 的自动规划身体类型，以下类型的详细规划定义在 setting.ts 中
 */
type BodyAutoConfigConstant =
    'harvester' |
    'worker' |
    'upgrader' |
    'manager' |
    'processor' |
    'reserver' |
    'attacker' |
    'healer' |
    'dismantler' |
    'remoteHarvester'


/**
 * 身体配置项类别
 * 包含了所有角色类型的身体配置
 */
type BodyConfigs = {
    [type in BodyAutoConfigConstant]: BodyConfig
}

/**
 * 单个角色类型的身体部件配置
 * 其键代表房间的 energyAvailable 属性
 * 300 就代表房间能量为 0 ~ 300 时应该使用的身体部件，该区间前开后闭
 * 例如：房间的 energyAvailable 为 600，则就会去使用 800 的身体部件，
 */
type BodyConfig = {
    [energyLevel in 300 | 550 | 800 | 1300 | 1800 | 2300 | 5600 | 10000]: BodyPartConstant[]
}

interface StructureSpawn {
    getBodys(bodyType: BodyAutoConfigConstant): BodyPartConstant[];
}

interface StructureTower{
    work():void;
}

/**
 * Creep 拓展
 * 来自于 mount.creep.ts
 */
 interface Creep {
    /**
     * 发送日志
     * 
     * @param content 日志内容
     * @param instanceName 发送日志的实例名
     * @param color 日志前缀颜色
     * @param notify 是否发送邮件
     */
    log(content:string, color?: Colors, notify?: boolean): void

    work(): void
    goTo(target: RoomPosition, range?: number): CreepMoveReturnCode | ERR_NO_PATH | ERR_INVALID_TARGET | ERR_NOT_FOUND
    getEngryFrom(target: Structure|Source): ScreepsReturnCode
}