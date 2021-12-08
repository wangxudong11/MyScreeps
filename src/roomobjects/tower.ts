import { log } from '@/utils'
export default class TowerExtension extends StructureTower {
    work(): void {
        //log("Tower开始工作",["运行信息"],'green')
        var items = this.room.find(FIND_STRUCTURES, {
            filter: x => x.hits < x.hitsMax&&x.structureType!='constructedWall'
        }).sort(x => x.hits / x.hitsMax);

        //log(items.length.toString(),["运行信息","待维修数量"],'green');
        if (items.length > 0)
            this.repair(items[0]);
    }
}