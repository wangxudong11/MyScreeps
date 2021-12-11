import _ from "lodash"

/**
 * 初级房间运维角色组
 * 本角色组包括了在没有 Storage 和 Link 的房间内运维所需的角色
 */
const roles: {
    [role in BaseRoleConstant]: (data: CreepData) => ICreepConfig
} = {
    /**
     * 采集者
     * 从指定 source 中获取能量 > 将能量存放到身下的 container 中
     */
    harvester: (data: HarvesterData): ICreepConfig => ({
        // 向 container 或者 source 移动
        // 在这个阶段中，targetId 是指 container 或 conatiner 的工地或 source
        prepare: creep => {
            let target: StructureContainer | Source | ConstructionSite
            // 如果有缓存的话就获取缓存
            if (creep.memory.targetId)
                target = Game.getObjectById<StructureContainer | Source>(creep.memory.sourceId)
            const source = Game.getObjectById<Source>(data.sourceId)

            // 没有缓存或者缓存失效了就重新获取
            if (!target) {
                // 先尝试获取 container
                const containers = source.pos.findInRange<StructureContainer>(FIND_STRUCTURES, 1, {
                    filter: s => s.structureType === STRUCTURE_CONTAINER
                })

                // 找到了就把 container 当做目标
                if (containers.length > 0)
                    target = containers[0]
            }

            // 还没找到就找 container 的工地
            if (!target) {
                const constructionSite = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
                    filter: s => s.structureType === STRUCTURE_CONTAINER
                })

                if (constructionSite.length > 0)
                    target = constructionSite[0]
            }

            // 如果还是没找到的话就用 source 当作目标
            if (!target)
                target = source
            creep.memory.targetId = target.id

            // 设置移动范围并进行移动（source 走到附近、container 和工地就走到它上面）
            const range = target instanceof Source ? 1 : 0
            creep.goTo(target.pos, range)

            // 抵达位置了就准备完成
            if (creep.pos.inRangeTo(target.pos, range))
                return true
            return false
        },
        // 因为 prepare 准备完之后会先执行 source 阶段，所以在这个阶段里对 container 进行维护
        // 在这个阶段中，targetId 仅指 container
        source: creep => {
            creep.say('🚧')

            // 没有能量就进行采集，因为是维护阶段，所以允许采集一下工作一下
            if (creep.store[RESOURCE_ENERGY] <= 0) {
                creep.getEngryFrom(Game.getObjectById(data.sourceId))
                return false
            }

            // 获取 prepare 阶段中保存的 targetId
            let target = Game.getObjectById<StructureContainer | Source>(creep.memory.targetId)

            // 存在 container，把血量修满
            if (target && target instanceof StructureContainer) {
                creep.repair(target)
                // 血修满了就正式进入采集阶段
                return target.hits >= target.hitsMax
            }

            // 不存在 container，开始新建，首先尝试获取工地缓存，没有缓存就新建工地
            let constructionSite: ConstructionSite
            if (!data.constructionSiteId)
                creep.pos.createConstructionSite(STRUCTURE_CONTAINER)
            else
                constructionSite = Game.getObjectById<ConstructionSite>(data.constructionSiteId)

            // 没找到工地缓存或者工地没了，重新搜索
            if (!constructionSite)
                constructionSite = creep.pos.lookFor(LOOK_CONSTRUCTION_SITES).find(s => s.structureType === STRUCTURE_CONTAINER)

            // 还没找到就说明有可能工地已经建好了，进行搜索
            if (!constructionSite) {
                const container = creep.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER)

                // 找到了造好的 container 了，添加进房间
                if (container) {
                    //creep.room.registerContainer(container as StructureContainer)
                    return true
                }

                // 还没找到，等下个 tick 会重新新建工地
                return false
            }

            // 找到了就缓存 id
            else
                data.constructionSiteId = constructionSite.id

            creep.build(constructionSite)
        },
        // 采集阶段会无脑采集，过量的能量会掉在 container 上然后被接住存起来
        target: creep => {
            creep.getEngryFrom(Game.getObjectById(data.sourceId))

            // 快死了就把身上的能量丢出去，这样就会存到下面的 container 里，否则变成墓碑后能量无法被 container 自动回收
            if (creep.ticksToLive < 2)
                creep.drop(RESOURCE_ENERGY)
            return false
        },
        bodys: 'harvester'
    }),

    /**
     * 收集者
     * 从指定 source 中获取资源 > 将资源转移到指定建筑中
     */
    collector: (data: HarvesterData): ICreepConfig => ({
        prepare: creep => {
            // 已经到附近了就准备完成
            if (creep.pos.isNearTo((<Structure>Game.getObjectById(data.sourceId)).pos))
                return true

            // 否则就继续移动
            else {
                creep.goTo(Game.getObjectById<Source>(data.sourceId).pos)
                return false
            }
        },
        source: creep => {
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0)
                return true

            const source = Game.getObjectById<Source>(data.sourceId)
            if (!source) {
                creep.say('目标找不到!')
                return false
            }

            const actionResult = creep.harvest(source)

            if (actionResult === ERR_NOT_IN_RANGE)
                creep.goTo(source.pos)

            // 快死了就把能量移出去
            if (creep.ticksToLive <= 3)
                return true
        },
        target: creep => {
            const target: Structure = Game.getObjectById(data.targetId)
            // 找不到目标了，自杀并重新运行发布规划
            if (!target) {
                creep.say('目标找不到!')
                //creep.room.releaseCreep('harvester')
                creep.suicide()
                return false
            }

            if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                creep.goTo(target.pos)

            if (creep.store.getUsedCapacity() === 0)
                return true
        },
        bodys: 'worker'
    }),

    /**
     * 填充单位
     * 从 container 中获取能量 > 执行房间物流任务
     * 在空闲时间会尝试把能量运输至 storage
     */
    filler: (data: WorkerData): ICreepConfig => ({
        // 能量来源（container）没了就自觉放弃
        isNeed: room => {
            return true
        },
        // 一直尝试从 container 里获取能量，不过拿到了就走
        source: creep => {
            if (creep.store[RESOURCE_ENERGY] > 0)
                return true

            // 获取源 container
            let source: StructureContainer | StructureStorage = Game.getObjectById<StructureContainer>(data.sourceId)
            // container 没能量了就尝试从 storage 里获取能量执行任务
            // 原因是有了 sourceLink 之后 container 会有很长一段时间没人维护（直到 container 耐久掉光）
            // 如果没有这个判断的话 filler 会在停止孵化之前有好几辈子都呆在空 container 前啥都不干
            if (!source || source.store[RESOURCE_ENERGY] <= 0)
                source = creep.room.storage

            creep.getEngryFrom(source)
        },
        // 维持房间能量填充
        target: creep => {
            //对目标进行排序，顺序为扩展（extension）-》spawn-》Tower
            var targets = _.sortBy(creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_TOWER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            }),x=>x.structureType);

            if(targets.length> 0){
                if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            

            // 空闲时间会尝试把能量存放到 storage 里
            if (!creep.room.storage)
                return false

            const source = Game.getObjectById<StructureContainer>(data.sourceId)
            // source container 还有 harvester 维护时才会把能量转移至 storage
            // 否则结合 source 阶段，filler 会在 container 等待老化时在 storage 旁边无意义举重
            if (source && source.store[RESOURCE_ENERGY] > 0)
                creep.transfer(creep.room.storage, RESOURCE_ENERGY)
            else
                creep.say('💤')

            if (creep.store[RESOURCE_ENERGY] <= 0)
                return true
        },
        bodys: 'manager'
    }),

    /**
     * 升级者
     * 不会采集能量，只会从指定目标获取能量
     * 从指定建筑中获取能量 > 升级 controller
     */
    upgrader: (data: WorkerData): ICreepConfig => ({
        source: creep => {
            // 因为只会从建筑里拿，所以只要拿到了就去升级
            if (creep.store[RESOURCE_ENERGY] > 0)
                return true

            const source: StructureTerminal | StructureStorage | StructureContainer = Game.getObjectById(data.sourceId)

            // 如果来源是 container 的话就等到其中能量大于指定数量再拿（优先满足 filler 的能量需求）
            if (source && source.structureType === STRUCTURE_CONTAINER && source.store[RESOURCE_ENERGY] <= 500)
                return false

            // 获取能量
            const result = creep.getEngryFrom(source)
            // 但如果是 Container 或者 Link 里获取能量的话，就不会重新运行规划
            if ((result === ERR_NOT_ENOUGH_RESOURCES || result === ERR_INVALID_TARGET) &&
                (source instanceof StructureTerminal || source instanceof StructureStorage)) {
                // 如果发现能量来源（建筑）里没有能量了，就自杀并重新运行 upgrader 发布规划
                //creep.room.releaseCreep('upgrader')
                creep.suicide()
            }
        },
        target: creep => {
            if (creep.upgradeController(creep.room.controller) === ERR_NOT_ENOUGH_RESOURCES)
                return true
        },
        bodys: 'upgrader'
    }),

    /**
     * 建筑者
     * 只有在有工地时才会生成
     * 从指定结构中获取能量 > 查找建筑工地并建造
     *
     * @param spawnRoom 出生房间名称
     * @param sourceId 要挖的矿 id
     */
    builder: (data: WorkerData): ICreepConfig => ({
        // 工地都建完就就使命完成
        isNeed: room => {
            const targets: ConstructionSite[] = room.find(FIND_MY_CONSTRUCTION_SITES)
            return targets.length > 0 ? true : false
        },
        // 把 data 里的 sourceId 挪到外边方便修改
        prepare: creep => {
            creep.memory.sourceId = data.sourceId
            return true
        },
        // 根据 sourceId 对应的能量来源里的剩余能量来自动选择新的能量来源
        source: creep => {
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0)
                return true

            // 获取有效的能量来源
            let source: StructureStorage | StructureTerminal | StructureContainer | Source
            if (!creep.memory.sourceId) {
                source = creep.room.getAvailableSource()
                creep.memory.sourceId = source.id
            }
            else
                source = Game.getObjectById(creep.memory.sourceId)

            // 之前用的能量来源没能量了就更新来源（如果来源已经是 source 的话就不改了）
            if (creep.getEngryFrom(source) === ERR_NOT_ENOUGH_RESOURCES && source instanceof Structure)
                delete creep.memory.sourceId
        },
        target: creep => {
            // 有新墙就先刷新墙
            if (creep.memory.fillWallId)
                creep.steadyWall()

            // 没有就建其他工地
            else if (creep.buildStructure() !== ERR_NOT_FOUND) { }

            // 工地也没了就去升级
            else if (creep.upgrade()) { }

            if (creep.store.getUsedCapacity() === 0)
                return true
        },
        bodys: 'worker'
    }),

    /**
     * 维修者
     * 从指定结构中获取能量 > 维修房间内的建筑
     * 注：目前维修者只会在敌人攻城时使用
     *
     * @param spawnRoom 出生房间名称
     * @param sourceId 要挖的矿 id
     */
    repairer: (data: WorkerData): ICreepConfig => ({
        // 根据敌人威胁决定是否继续生成
        isNeed: () => true,
        source: creep => {
            creep.getEngryFrom(Game.getObjectById(data.sourceId) || creep.room.storage || creep.room.terminal)

            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0)
                return true
        },
        // 一直修墙就完事了
        target: creep => {
            let importantWall = creep.room._importantWall
            // 先尝试获取焦点墙，有最新的就更新缓存，没有就用缓存中的墙
            if (importantWall)
                creep.memory.fillWallId = importantWall.id
            else if (creep.memory.fillWallId)
                importantWall = Game.getObjectById(creep.memory.fillWallId)

            // 有焦点墙就优先刷
            if (importantWall) {
                const actionResult = creep.repair(creep.room._importantWall)
                if (actionResult === OK) {
                    if (!creep.memory.standed) {
                        creep.memory.standed = true
                        creep.room.addRestrictedPos(creep.name, creep.pos)
                    }

                    // 离墙三格远可能正好把路堵上，所以要走进一点
                    if (!creep.room._importantWall.pos.inRangeTo(creep.pos, 2))
                        creep.goTo(creep.room._importantWall.pos)
                }
                else if (actionResult == ERR_NOT_IN_RANGE)
                    creep.goTo(creep.room._importantWall.pos)
            }

            // 否则就按原计划维修
            else
                creep.fillDefenseStructure()

            if (creep.store.getUsedCapacity() === 0)
                return true
        },
        bodys: 'worker'
    }),
    miner: undefined
}

export default roles