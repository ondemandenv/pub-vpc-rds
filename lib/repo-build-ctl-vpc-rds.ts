import {Peer, Port, SecurityGroup, SelectedSubnets, SubnetType} from "aws-cdk-lib/aws-ec2";
import {RepoBuildCtlVpc} from "./repo-build-ctl-vpc";
import {
    CfnDBCluster,
    Credentials,
    ParameterGroup,
    ServerlessCluster
} from "aws-cdk-lib/aws-rds";
import {App, Stack, StackProps} from "aws-cdk-lib";
import {RepoBuildCtlVpcRdsSchusrs} from "./repo-build-ctl-vpc-rds-schusrs";
import {
    AnyContractsEnVer,
    ContractsCrossRefProducer, ContractsEnverCdk,
    ContractsRdsCluster, ContractsShareOut, OndemandContracts,
} from "@ondemandenv/odmd-contracts";
import {
    ContractsEnverCdkDefaultVpc
} from "@ondemandenv/odmd-contracts/lib/repos/_default-vpc-rds/odmd-enver-default-vpc-rds";
import {ArnPrincipal, Policy, PolicyStatement, Role} from "aws-cdk-lib/aws-iam";


export class RepoBuildCtlVpcRds extends Stack {

    private readonly vpcStack: RepoBuildCtlVpc
    private readonly rdsCluster: ServerlessCluster;

    constructor(parent: App, vpcStack: RepoBuildCtlVpc, rds: ContractsRdsCluster, props: StackProps) {
        super(parent, ContractsEnverCdk.SANITIZE_STACK_NAME(vpcStack.stackName + '-' + rds.clusterIdentifier), props);
        this.vpcStack = vpcStack;

        const pid = `odmd-${rds.vpc.build.buildId}-${rds.vpc.vpcName}`
        let rdsSubnets: SelectedSubnets;
        try {
            rdsSubnets = this.vpcStack.vpc.selectSubnets({subnetType: SubnetType.PRIVATE_WITH_EGRESS});
        } catch (e) {
            rdsSubnets = vpcStack.vpc.selectSubnets({subnetType: SubnetType.PRIVATE_ISOLATED});
            if (rdsSubnets.subnets.length == 0) {
                throw new Error("No private subnets available for rds?")
            }
        }

        const rdsClusterSg = new SecurityGroup(this, rds.defaultSgName, {
            securityGroupName: rds.defaultSgName,
            vpc: vpcStack.vpc,
        });

        this.rdsCluster = new ServerlessCluster(this, rds.clusterIdentifier, {
            clusterIdentifier: rds.clusterIdentifier,
            engine: rds.engine,
            vpc: vpcStack.vpc,
            scaling: rds.scaling,
            defaultDatabaseName: rds.defaultDatabaseName,
            securityGroups: [rdsClusterSg],
            vpcSubnets: rdsSubnets,
            credentials: Credentials.fromGeneratedSecret(rds.rootUsername, {secretName: rds.rootSecretName}),
            parameterGroup: new ParameterGroup(this, 'paramGroup', {
                engine: rds.engine,
                parameters: {
                    log_connections: '1',
                    log_disconnections: '1',
                    log_lock_waits: '1',
                    log_min_messages: 'debug1',
                    log_statement: 'all',
                }
            })
        });
        const cfnCluster = this.rdsCluster.node.defaultChild as CfnDBCluster;

        //Aurora Serverless currently doesn't support CloudWatch Log Export.
        // cfnCluster.enableCloudwatchLogsExports = ['postgresql'];
        // cfnCluster.performanceInsightsEnabled = true;

        rdsClusterSg.addIngressRule(Peer.ipv4(vpcStack.vpcEnver.centralVpcCidr.getSharedValue(this)), Port.tcp(this.rdsCluster.clusterEndpoint.port))

        rds.allowingCIDRS.forEach(cidr => {
            rdsClusterSg.addIngressRule(Peer.ipv4(cidr.getSharedValue(this)), Port.tcp(this.rdsCluster.clusterEndpoint.port))
        })

        const myEnver = OndemandContracts.inst.defaultVpcRds.envers.find(e => e.targetRevision.toString() == OndemandContracts.REV_REF_value) as ContractsEnverCdkDefaultVpc;

        const masterRole = new Role(this, 'masterRole', {
            assumedBy: new ArnPrincipal(`arn:aws:iam::${OndemandContracts.inst.accounts.central}:role/${
                myEnver.rdsTrustCentralRoleName
            }`)
        });
        this.rdsCluster.secret!.grantRead(masterRole)

        const secretPath = 'odmd/' + rds.vpc.build.buildId + '/' + rds.clusterIdentifier;
        const createUsrPolicy = new Policy(this, 'create-user-secret', {
            statements: [
                new PolicyStatement({
                    actions: ['secretsmanager:*'],
                    resources: [`arn:aws:secretsmanager:${this.vpcStack.region}:${this.vpcStack.account}:secret:${secretPath}*`]
                })
            ]
        });
        masterRole.attachInlinePolicy(createUsrPolicy)

        new ContractsShareOut(this, new Map<ContractsCrossRefProducer<AnyContractsEnVer>, string | number>(
            new Map<ContractsCrossRefProducer<AnyContractsEnVer>, string | number>([
                [rds.clusterHostname, this.rdsCluster.clusterEndpoint.hostname],
                [rds.clusterPort, this.rdsCluster.clusterEndpoint.port],
                [rds.clusterSocketAddress, this.rdsCluster.clusterEndpoint.socketAddress],
                [rds.clusterMasterRoleArn, masterRole.roleArn],
            ])
        ))

        rds.schemaRoleUsers.forEach(su => {
            new RepoBuildCtlVpcRdsSchusrs(parent, this.stackName, rds, su, props)
        })

    }

}

