export class Utils{
    
    private MaxEngery: Array<number> = [300,300,550,800,1300,1800,2300,2800,3300];
    static getBody(role:RoleType,rcl:number):BodyPartConstant[]{
        
        return bodyPart[rcl][role];
    }
}

export enum RoleType{
    Harvester,
    Builder,
    Upgrader,
}

export class CreepCount {
    [1]: {[RoleType.Harvester]:2,[RoleType.Builder]:1,[RoleType.Upgrader]:2};
    [2]: {[RoleType.Harvester]:2,[RoleType.Builder]:1,[RoleType.Upgrader]:2};
    [3]: {[RoleType.Harvester]:2,[RoleType.Builder]:1,[RoleType.Upgrader]:2};
    [4]: {[RoleType.Harvester]:2,[RoleType.Builder]:1,[RoleType.Upgrader]:2};
}
export class bodyPart{
    [1]:{
        [RoleType.Harvester]:[WORK,MOVE,CARRY,MOVE,CARRY],
        [RoleType.Builder]:[WORK,MOVE,CARRY,MOVE,CARRY],
        [RoleType.Upgrader]:[WORK,MOVE,CARRY,MOVE,CARRY]
    }
    [2]:{
        [RoleType.Harvester]:[WORK,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY],
        [RoleType.Builder]:[WORK,WORK,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY],
        [RoleType.Upgrader]:[WORK,WORK,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY]
    }
    [3]:{
        [RoleType.Harvester]:[WORK,WORK,WORK,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY],
        [RoleType.Builder]:[WORK,WORK,WORK,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY],
        [RoleType.Upgrader]:[WORK,WORK,WORK,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY,MOVE,CARRY]
    }
}

export enum Role{
    // 静止作业人员
    StaticWorker,
    // 普通员工
    NormalWorker,
    // 物流员工
    LogisticWorker,
}
export class screepCount2 {
    [1]: {[Role.StaticWorker]:2,[Role.NormalWorker]:0,[Role.LogisticWorker]:2};
    [2]: {[Role.StaticWorker]:2,[Role.NormalWorker]:2,[Role.LogisticWorker]:2};
    [3]: {[Role.StaticWorker]:2,[Role.NormalWorker]:2,[Role.LogisticWorker]:2};
    [4]: {[Role.StaticWorker]:2,[Role.NormalWorker]:2,[Role.LogisticWorker]:2};
}
export class bodyPart2{
    [1]:{
        [Role.StaticWorker]:[WORK,WORK,WORK,WORK,MOVE,CARRY],
        [Role.NormalWorker]:[WORK,MOVE,CARRY],
        [Role.LogisticWorker]:[MOVE,MOVE,MOVE,CARRY,CARRY,CARRY]
    }
    [2]:{
        [Role.StaticWorker]:[WORK,WORK,WORK,WORK,MOVE,CARRY],
        [Role.NormalWorker]:[WORK,MOVE,CARRY],
        [Role.LogisticWorker]:[MOVE,MOVE,MOVE,CARRY,CARRY,CARRY]
    }
    [3]:{
        [Role.StaticWorker]:[WORK,WORK,WORK,WORK,MOVE,CARRY],
        [Role.NormalWorker]:[WORK,MOVE,CARRY],
        [Role.LogisticWorker]:[MOVE,MOVE,MOVE,CARRY,CARRY,CARRY]
    }
}