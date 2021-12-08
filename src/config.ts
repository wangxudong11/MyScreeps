import _, { filter } from "lodash";
import { RoleType } from "./utils";

export const Config = {
    init(): void {
        this.initSource();
        this.initCreep();
    },
    initCreep() {
        for (const name in Game.creeps) {
            if (Memory.creepConfigs[name])
                continue;
            const creep = Game.creeps[name];
            switch (creep.memory.role) {
                case RoleType.Builder:

                    break;

                default:
                    break;
            }
        }
    },
    // harvester逻辑
    harvesterInit(creep: Creep) {
        var harvesters = _.find(Memory.creepConfigs, x => x.role == 'harvester' && x.spawnRoom == creep.room.name);
        let sourceId: string;
        let targetId: string;
        // 确认资源点
        const sourceConfigs = Memory.sourceConfigs;
        var count = _.countBy(harvesters, "data.sourceId");
        for (const key in count) {
            if (count[key] >= sourceConfigs[key].seat)
                continue;
            sourceId = key;
        }

        if (!sourceId)
            return;

        var sourceConfig = sourceConfigs[sourceId];
        if (sourceConfig.containerId) {
            if (Game.getObjectById(sourceConfig.containerId) as StructureContainer)
                targetId = sourceConfig.containerId;
        }
        if (!targetId) {
            var targets = _.sortBy(creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_TOWER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            }), x => x.structureType);
            targetId = targets[0].id;
        }

        Memory.creepConfigs[creep.name] = {
            role: 'harvester',
            data: { sourceId: sourceId, targetId: targetId },
            spawnRoom: creep.room.name,
            bodys: 'harvester'
        };
    },
    // builder逻辑
    builderInit(creep: Creep) {
        Memory.creepConfigs[creep.name] = {
            role: 'worker',
            data: { sourceId: creep.room.find(FIND_SOURCES)[0].id, targetId: creep.room.find(FIND_CONSTRUCTION_SITES)[0].id },
            spawnRoom: creep.room.name,
            bodys: 'worker'
        };
    },
    // upgrader逻辑
    upgraderInit(name: string) {
        var creep = Game.creeps[name];
        Memory.creepConfigs[name] = {
            role: 'upgrader',
            data: { sourceId: creep.room.find(FIND_SOURCES)[0].id, targetId: creep.room.controller.id },
            spawnRoom: creep.room.name,
            bodys: 'upgrader'
        };
    },
    initSource() {
        var sources: Source[]=[];
        _.each(Game.rooms, x => sources = sources.concat(x.find(FIND_SOURCES)));
        for (const name in sources) {
            if (!Memory.sourceConfigs[sources[name].id]) {
                var source = sources[name];
                //var containers = source.pos.findInRange(FIND_MY_STRUCTURES, 1, { filter: { structureType: STRUCTURE_CONTAINER } })
                //var containerId:string="";
                //if(containers){
                //    var consites= source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1, { filter: { structureType: STRUCTURE_CONTAINER } })
                //    if(consites)
                //        containerId=consites[0].id;
                //}
                //containerId=containers[0].id;
                //if(containerId=="")
                //    source.room.createConstructionSite(1,2,STRUCTURE_CONTAINER);

                Memory.sourceConfigs[source.id] = {
                    containerId: "",
                    room: source.room.name,
                    seat: 1
                };
            }
        }
    },
    //initConStruction(){
    //    let constructionList=Memory.constructionList;
    //    for (const name in Game.rooms) {
    //        let room=Game.rooms[name];
    //        if(!constructionList[name])
    //            constructionList[name]=[];
    //        for (const str in room.find(FIND_CONSTRUCTION_SITES)) {
    //            if (Object.prototype.hasOwnProperty.call(game, str)) {
    //                const element = game[str];
    //                
    //            }
    //        }
//
    //        if (Object.prototype.hasOwnProperty.call(object, key)) {
    //            const element = object[key];
    //            
    //        }
    //    }
    //}
}