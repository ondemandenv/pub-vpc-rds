import {App, Stack, StackProps} from "aws-cdk-lib";
import {
    AnyContractsEnVer,
    ContractsCrossRefProducer, ContractsEnverCdk,
    ContractsRdsCluster,
    ContractsShareOut,
    PgSchemaUsers,
    PgSchemaUsersProps
} from "@ondemandenv/odmd-contracts";


export class RepoBuildCtlVpcRdsSchusrs extends Stack {
    constructor(parent: App, pn: string, rds: ContractsRdsCluster, m: PgSchemaUsersProps, props: StackProps) {
        super(parent, ContractsEnverCdk.SANITIZE_STACK_NAME(pn + '-' + m.schema), props);

        const pgUsrs = new PgSchemaUsers(this, m, true)

        new ContractsShareOut(this, new Map<ContractsCrossRefProducer<AnyContractsEnVer>, string | number>(
            new Map(m.userSecrets.map(us => [rds.usernameToSecretId.get(us.userName)!, pgUsrs.usernameToSecretId.get(us.userName)!]))
        ))
    }

}

