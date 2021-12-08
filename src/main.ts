import _ from 'lodash';
import { ErrorMapper } from './modules/errorMapper'
import { roleHarvester } from '@/roles/harvester'
import { roleUpgrader } from '@/roles/upgrader'
import { roleBuilder } from '@/roles/builder'
import { RoleType } from '@/utils'
import { CreepCount } from '@/setting'
import assignall from '@/roomobjects'
import memInit from '@/modules/memory'
import {Config} from '@/config'

export const loop = ErrorMapper.wrapLoop(() => {
    memInit();
    assignall();
    Config.init();
    if (Game.time % 20 == 0) {
        console.log('Version:0.19');
    }
    // 销毁死亡creep
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    for(var name in Memory.creepConfigs){
        if(!Game.creeps[name]){
            delete Memory.creepConfigs[name];
            console.log('Clearing non-existing creepConfig memory:', name);
        }
    }


    var rcl = Game.spawns['Spawn1'].room.controller.level;
    var spawn = Game.spawns['Spawn1'];
    // 检查creep数量并补充
    var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
    var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');
    if (upgraders.length < CreepCount[rcl][RoleType.Upgrader]) {
        var newName = 'Upgrader' + Game.time;
        console.log('Spawning new harvester: ' + newName);
        spawn.spawnCreep(spawn.getBodys(RoleType.Upgrader), newName,
            { memory: { role: 'upgrader' } });
    }
    if (builders.length < CreepCount[rcl][RoleType.Builder]) {
        var newName = 'Builder' + Game.time;
        console.log('Spawning new harvester: ' + newName);
        spawn.spawnCreep(spawn.getBodys(RoleType.Worker), newName,
            { memory: { role: 'builder' } });
    }
    if (harvesters.length < CreepCount[rcl][RoleType.Harvester]) {
        var newName = 'Harvester' + Game.time;
        console.log('Spawning new harvester: ' + newName);
        spawn.spawnCreep(spawn.getBodys(RoleType.Harvester), newName,
            { memory: { role: 'harvester' } });
    }

    if (Game.spawns['Spawn1'].spawning) {
        var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
        Game.spawns['Spawn1'].room.visual.text(
            '🛠️' + spawningCreep.memory.role,
            Game.spawns['Spawn1'].pos.x + 1,
            Game.spawns['Spawn1'].pos.y,
            { align: 'left', opacity: 0.8 });
    }

    // tower修复逻辑
    var tower = Game.rooms["W22N26"].find(FIND_MY_STRUCTURES, { filter: x => x.structureType == STRUCTURE_TOWER })[0] as StructureTower;
    if (tower)
        tower.work();


    // tower逻辑
    /*var tower = Game.rooms["W28N28"].find(FIND_MY_STRUCTURES).find(x=>x.structureType==STRUCTURE_TOWER) as StructureTower;
    if(tower) {
        var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax
        });
        if(closestDamagedStructure) {
            tower.repair(closestDamagedStructure);
        }

        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(closestHostile) {
            tower.attack(closestHostile);
        }
    }*/

    // creep角色逻辑
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        if (creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if (creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
    }
})

/**
 * 接受两个数字并相加
 */
export const testFn = function (num1: number, num2: number): number {
    return num1 + num2
}